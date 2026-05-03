import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { pool, query, rowToCamel, rowsToCamel } from "../db.js";
import { ApiError, asyncHandler } from "../errors.js";
import { validate } from "../validate.js";
import { requireAuth } from "../auth.js";

const router = Router();

const STATUSES = ["yet-to-start", "in-progress", "complete"];
const PRIORITIES = ["low", "medium", "high"];
const ISSUE_TYPES = ["epic", "story", "task", "bug", "subtask"];
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

const createSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  assigneeId:  z.string().min(1),
  date:        dateStr,
  dueDate:     dateStr,
  priority:    z.enum(PRIORITIES),
  status:      z.enum(STATUSES).optional().default("yet-to-start"),
  issueType:   z.enum(ISSUE_TYPES).optional().default("task"),
  parentId:    z.string().min(1).nullable().optional(),
  sprintId:    z.string().min(1).nullable().optional(),
});

const updateSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  assigneeId:  z.string().min(1).optional(),
  date:        dateStr.optional(),
  dueDate:     dateStr.optional(),
  priority:    z.enum(PRIORITIES).optional(),
  status:      z.enum(STATUSES).optional(),
  extended:    z.boolean().optional(),
  issueType:   z.enum(ISSUE_TYPES).optional(),
  parentId:    z.string().min(1).nullable().optional(),
  sprintId:    z.string().min(1).nullable().optional(),
  rank:        z.number().optional(),
});

const taskCols = `
  id, issue_key, issue_type, parent_id, sprint_id, title, description, assignee_id,
  task_date AS date, due_date, status, priority, extended, rank, created_at, updated_at
`;

// Hierarchy rules:
//   epic:                parent_id MUST be null
//   story | task | bug:  parent_id null OR references an epic
//   subtask:             parent_id REQUIRED, parent must be story|task|bug
async function validateHierarchy(client, { type, parentId, selfId }) {
  if (type === "epic") {
    if (parentId) throw new ApiError(400, "Epics cannot have a parent", "hierarchy");
    return;
  }
  if (type === "subtask" && !parentId) {
    throw new ApiError(400, "Subtasks require a parent", "hierarchy");
  }
  if (!parentId) return; // top-level story/task/bug — fine

  if (selfId && parentId === selfId) {
    throw new ApiError(400, "Task cannot be its own parent", "hierarchy");
  }

  // Load parent + walk up the chain (cycle prevention) and collect the parent type.
  let cur = parentId;
  let parentType = null;
  const seen = new Set();
  while (cur) {
    if (seen.has(cur)) throw new ApiError(400, "Hierarchy cycle detected", "hierarchy");
    if (selfId && cur === selfId) {
      throw new ApiError(400, "Cannot reparent under own descendant", "hierarchy");
    }
    seen.add(cur);
    const { rows } = await client.query(
      "SELECT id, issue_type, parent_id FROM tasks WHERE id = $1",
      [cur]
    );
    if (!rows[0]) throw new ApiError(400, "Parent not found", "hierarchy");
    if (parentType === null) parentType = rows[0].issue_type;
    cur = rows[0].parent_id;
  }

  if ((type === "story" || type === "task" || type === "bug") && parentType !== "epic") {
    throw new ApiError(400, `${type} can only nest under an epic`, "hierarchy");
  }
  if (type === "subtask" && !["story", "task", "bug"].includes(parentType)) {
    throw new ApiError(400, "Subtasks can only nest under story/task/bug", "hierarchy");
  }
}

async function getSettings(client) {
  const { rows } = await client.query("SELECT value FROM settings WHERE key = 'permissions'");
  return rows[0]?.value || {};
}

// If enforceWorkflow is enabled and any transitions are configured, only allow
// status moves that match a configured (from, to) pair. Self-transitions and
// fresh-creation status are always allowed.
async function checkTransitionAllowed(client, fromStatus, toStatus) {
  if (fromStatus === toStatus) return;
  const settings = await getSettings(client);
  if (settings.enforceWorkflow !== true) return;
  const { rows } = await client.query(
    "SELECT 1 FROM status_transitions WHERE from_status = $1 AND to_status = $2",
    [fromStatus, toStatus]
  );
  if (!rows.length) {
    throw new ApiError(400, `Transition ${fromStatus} → ${toStatus} is not allowed`, "transition_blocked");
  }
}

const isOwnerOrAdmin = (user) => user?.role === "owner" || user?.role === "admin";

async function logActivity(client, taskId, actorId, action, details) {
  await client.query(
    "INSERT INTO activity (id, task_id, actor_id, action, details) VALUES ($1,$2,$3,$4,$5)",
    [nanoid(10), taskId, actorId, action, details ? JSON.stringify(details) : null]
  );
}

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { assigneeId, date, mine, issueType, parentId, topLevel, sprintId, backlog } = req.query;
    const where = [];
    const params = [];
    if (mine === "1" || !isOwnerOrAdmin(req.user)) {
      params.push(req.user.id);
      where.push(`assignee_id = $${params.length}`);
    } else if (assigneeId) {
      params.push(assigneeId);
      where.push(`assignee_id = $${params.length}`);
    }
    if (date) {
      params.push(date);
      where.push(`task_date = $${params.length}`);
    }
    if (issueType) {
      const types = String(issueType).split(",").filter(Boolean);
      if (types.length) {
        params.push(types);
        where.push(`issue_type = ANY($${params.length})`);
      }
    }
    if (parentId) {
      params.push(parentId);
      where.push(`parent_id = $${params.length}`);
    } else if (topLevel === "1") {
      where.push(`parent_id IS NULL`);
    }
    if (sprintId) {
      params.push(sprintId);
      where.push(`sprint_id = $${params.length}`);
    } else if (backlog === "1") {
      where.push(`sprint_id IS NULL`);
    }
    // Backlog and sprint views are rank-ordered (manual prioritization).
    // Other views keep the original recency order.
    const ordering = (sprintId || backlog === "1") ? "ORDER BY rank ASC" : "ORDER BY created_at DESC";
    const sql = `SELECT ${taskCols} FROM tasks ${where.length ? "WHERE " + where.join(" AND ") : ""} ${ordering}`;
    const { rows } = await query(sql, params);
    res.json(rowsToCamel(rows));
  })
);

router.get(
  "/:id/children",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT ${taskCols} FROM tasks WHERE parent_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    res.json(rowsToCamel(rows));
  })
);

router.post(
  "/",
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { title, description, assigneeId, date, dueDate, priority, status, issueType, parentId, sprintId } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Permission: owner/admin can create freely; employees only when allowed
      // by settings AND only if assigning to themselves.
      if (!isOwnerOrAdmin(req.user)) {
        const settings = await getSettings(client);
        if (settings.empCanCreateTask !== true) {
          throw new ApiError(403, "Employees cannot create tasks", "forbidden");
        }
        if (assigneeId !== req.user.id) {
          throw new ApiError(403, "Employees can only create tasks for themselves", "forbidden");
        }
      }

      await validateHierarchy(client, { type: issueType, parentId: parentId || null });

      const id = nanoid(10);
      const { rows: keyRows } = await client.query("SELECT 'TF-' || nextval('task_seq') AS k");
      const issueKey = keyRows[0].k;
      // New tasks go to the bottom of the backlog/sprint by default.
      const { rows: rankRows } = await client.query("SELECT COALESCE(MAX(rank), 0) + 1024 AS r FROM tasks");
      const rank = rankRows[0].r;

      const { rows } = await client.query(
        `INSERT INTO tasks (id, issue_key, issue_type, parent_id, sprint_id, title, description, assignee_id, task_date, due_date, priority, status, rank)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING ${taskCols}`,
        [id, issueKey, issueType, parentId || null, sprintId || null, title, description, assigneeId, date, dueDate, priority, status, rank]
      );
      await client.query(
        "INSERT INTO activity (id, task_id, actor_id, action, details) VALUES ($1,$2,$3,'created',$4)",
        [nanoid(10), id, req.user.id, JSON.stringify({ assigneeId, status, priority, issueType, parentId: parentId || null, sprintId: sprintId || null })]
      );
      await client.query("COMMIT");
      res.status(201).json(rowToCamel(rows[0]));
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  })
);

router.patch(
  "/:id",
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows: existingRows } = await query(`SELECT ${taskCols} FROM tasks WHERE id = $1`, [id]);
    const existing = existingRows[0];
    if (!existing) throw new ApiError(404, "Task not found", "not_found");

    // Permission rules:
    //   owner/admin → can update anything on any task
    //   employee on own task → can always update `status`; other fields require
    //     empCanEditOwnTask, with `extended`/`dueDate` allowed by empCanExtendOwnTask
    //     even when full-edit is off
    //   employee on other's task → forbidden
    if (!isOwnerOrAdmin(req.user)) {
      if (existing.assignee_id !== req.user.id) {
        throw new ApiError(403, "Not your task", "forbidden");
      }
      const settings = await (async () => {
        const c = await pool.connect();
        try { return await getSettings(c); } finally { c.release(); }
      })();
      const sent = Object.keys(req.body);
      const allowAlways  = new Set(["status"]);
      const allowExtend  = new Set(["dueDate", "extended"]);
      for (const k of sent) {
        if (allowAlways.has(k)) continue;
        if (allowExtend.has(k) && settings.empCanExtendOwnTask === true) continue;
        if (settings.empCanEditOwnTask === true) continue;
        throw new ApiError(403, `Employees cannot update '${k}' (check workspace permissions)`, "forbidden");
      }
    }

    const colMap = {
      title: "title",
      description: "description",
      assigneeId: "assignee_id",
      date: "task_date",
      dueDate: "due_date",
      priority: "priority",
      status: "status",
      extended: "extended",
      issueType: "issue_type",
      parentId: "parent_id",
      sprintId: "sprint_id",
      rank: "rank",
    };
    const fields = [];
    const values = [];
    for (const [k, col] of Object.entries(colMap)) {
      if (req.body[k] !== undefined) {
        values.push((k === "parentId" || k === "sprintId") ? (req.body[k] || null) : req.body[k]);
        fields.push(`${col} = $${values.length}`);
      }
    }
    if (!fields.length) throw new ApiError(400, "No fields to update", "no_fields");
    fields.push(`updated_at = NOW()`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (req.body.issueType !== undefined || req.body.parentId !== undefined) {
        const nextType = req.body.issueType ?? existing.issue_type;
        const nextParent = req.body.parentId !== undefined ? (req.body.parentId || null) : existing.parent_id;
        await validateHierarchy(client, { type: nextType, parentId: nextParent, selfId: id });
      }

      if (req.body.status && req.body.status !== existing.status) {
        await checkTransitionAllowed(client, existing.status, req.body.status);
      }

      values.push(id);
      const { rows } = await client.query(
        `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING ${taskCols}`,
        values
      );
      if (req.body.status && req.body.status !== existing.status) {
        await logActivity(client, id, req.user.id, "status_changed", {
          from: existing.status,
          to: req.body.status,
        });
      }
      if (req.body.issueType && req.body.issueType !== existing.issue_type) {
        await logActivity(client, id, req.user.id, "type_changed", {
          from: existing.issue_type,
          to: req.body.issueType,
        });
      }
      if (req.body.parentId !== undefined && (req.body.parentId || null) !== existing.parent_id) {
        await logActivity(client, id, req.user.id, "parent_changed", {
          from: existing.parent_id,
          to: req.body.parentId || null,
        });
      }
      if (req.body.sprintId !== undefined && (req.body.sprintId || null) !== existing.sprint_id) {
        await logActivity(client, id, req.user.id, "sprint_changed", {
          from: existing.sprint_id,
          to: req.body.sprintId || null,
        });
      }
      if (req.body.extended === true && !existing.extended) {
        await logActivity(client, id, req.user.id, "extended", { dueDate: req.body.dueDate });
      }
      await client.query("COMMIT");
      res.json(rowToCamel(rows[0]));
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isOwnerOrAdmin(req.user)) {
      const { rows } = await query("SELECT assignee_id FROM tasks WHERE id = $1", [id]);
      if (!rows[0]) throw new ApiError(404, "Task not found", "not_found");
      if (rows[0].assignee_id !== req.user.id) {
        throw new ApiError(403, "Not your task", "forbidden");
      }
      const c = await pool.connect();
      try {
        const settings = await getSettings(c);
        if (settings.empCanDeleteOwnTask !== true) {
          throw new ApiError(403, "Employees cannot delete tasks (check workspace permissions)", "forbidden");
        }
      } finally { c.release(); }
    }
    const { rowCount } = await query("DELETE FROM tasks WHERE id = $1", [id]);
    if (!rowCount) throw new ApiError(404, "Task not found", "not_found");
    res.status(204).end();
  })
);

router.get(
  "/:id/activity",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows: taskRows } = await query("SELECT assignee_id FROM tasks WHERE id = $1", [id]);
    if (!taskRows[0]) throw new ApiError(404, "Task not found", "not_found");
    if (!isOwnerOrAdmin(req.user) && taskRows[0].assignee_id !== req.user.id) {
      throw new ApiError(403, "Not your task", "forbidden");
    }
    const { rows } = await query(
      `SELECT a.id, a.action, a.details, a.created_at,
              u.id AS actor_id, u.name AS actor_name, u.color AS actor_color
       FROM activity a JOIN users u ON u.id = a.actor_id
       WHERE a.task_id = $1
       ORDER BY a.created_at DESC`,
      [id]
    );
    res.json(rowsToCamel(rows));
  })
);

export default router;
