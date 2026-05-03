import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal.jsx";
import { RemarkThread } from "./RemarkThread.jsx";
import { ActivityFeed } from "./ActivityFeed.jsx";
import { STATUS_CONFIG, ISSUE_TYPE_CONFIG, validParentTypes } from "../lib/constants.js";
import { today } from "../lib/dates.js";
import { api } from "../lib/api.js";
import { canTransition } from "../lib/hierarchy.js";

const SUBTASK_PARENT_TYPES = ["story", "task", "bug"];

export function TaskModal({ task, emps, currentUser, transitions, enforceWorkflow, defaultTab = "details", onSave, onClose, onError, busy }) {
  const [f, setF] = useState({
    title:       task?.title || "",
    description: task?.description || "",
    assigneeId:  task?.assigneeId || emps[0]?.id || "",
    date:        task?.date || today(),
    dueDate:     task?.dueDate || today(),
    priority:    task?.priority || "medium",
    status:      task?.status || "yet-to-start",
    issueType:   task?.issueType || "task",
    parentId:    task?.parentId || "",
    sprintId:    task?.sprintId || "",
  });
  const [tab, setTab] = useState(defaultTab);
  const [parentOptions, setParentOptions] = useState([]);
  const [parentLoading, setParentLoading] = useState(false);
  const [sprints, setSprints] = useState([]);

  useEffect(() => {
    api.sprints.list().then(setSprints).catch(() => {});
  }, []);

  const allowedParents = useMemo(() => validParentTypes(f.issueType), [f.issueType]);
  const showParentPicker = allowedParents.length > 0;
  const parentRequired = f.issueType === "subtask";
  const showSubtasksTab = !!task && SUBTASK_PARENT_TYPES.includes(f.issueType);

  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));

  // Load parent candidates whenever issueType changes (and parent picker is shown).
  useEffect(() => {
    if (!showParentPicker) {
      setParentOptions([]);
      return;
    }
    let cancelled = false;
    setParentLoading(true);
    api.tasks
      .list({ issueType: allowedParents.join(",") })
      .then((rows) => {
        if (cancelled) return;
        // Cannot pick yourself as your own parent.
        const filtered = task ? rows.filter((r) => r.id !== task.id) : rows;
        setParentOptions(filtered);
      })
      .catch((err) => onError?.(err))
      .finally(() => !cancelled && setParentLoading(false));
    return () => { cancelled = true; };
  }, [showParentPicker, allowedParents.join(","), task?.id]);

  // If the chosen parentId is no longer valid for the current type, clear it.
  useEffect(() => {
    if (!showParentPicker) {
      if (f.parentId) s("parentId", "");
    } else if (f.parentId && parentOptions.length && !parentOptions.some((o) => o.id === f.parentId)) {
      s("parentId", "");
    }
  }, [showParentPicker, parentOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    if (!f.title.trim()) return;
    if (parentRequired && !f.parentId) {
      onError?.(new Error("Subtasks require a parent issue"));
      return;
    }
    onSave({ ...f, parentId: f.parentId || null, sprintId: f.sprintId || null });
  };

  return (
    <Modal
      title={task ? `Edit ${ISSUE_TYPE_CONFIG[f.issueType]?.label || "Task"}${task.issueKey ? ` · ${task.issueKey}` : ""}` : "Create New Task"}
      onClose={onClose}
      wide={!!task}
    >
      {task && (
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tbb ${tab === "details" ? "a" : ""}`} onClick={() => setTab("details")}>Details</button>
          {showSubtasksTab && (
            <button className={`tbb ${tab === "subtasks" ? "a" : ""}`} onClick={() => setTab("subtasks")}>Subtasks</button>
          )}
          <button className={`tbb ${tab === "remarks" ? "a" : ""}`} onClick={() => setTab("remarks")}>Remarks</button>
          <button className={`tbb ${tab === "activity" ? "a" : ""}`} onClick={() => setTab("activity")}>Activity</button>
        </div>
      )}

      {tab === "details" && (
        <>
          <div className="fr">
            <div className="ff">
              <label>Issue Type</label>
              <select className="fse" value={f.issueType} onChange={(e) => s("issueType", e.target.value)}>
                {Object.entries(ISSUE_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            {showParentPicker && (
              <div className="ff">
                <label>
                  Parent {parentRequired ? "*" : ""}
                  <span style={{ color: "var(--text2)", fontWeight: 400, fontSize: 11 }}>
                    {" "}({allowedParents.join(" / ")})
                  </span>
                </label>
                <select
                  className="fse"
                  value={f.parentId}
                  onChange={(e) => s("parentId", e.target.value)}
                  disabled={parentLoading || parentOptions.length === 0}
                >
                  <option value="">{parentLoading ? "Loading…" : parentOptions.length ? (parentRequired ? "Select parent…" : "None") : "No eligible parents"}</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {ISSUE_TYPE_CONFIG[p.issueType]?.icon} {p.issueKey} · {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="ff">
            <label>Title *</label>
            <input className="fi2" placeholder="e.g. Design onboarding screens"
              value={f.title} onChange={(e) => s("title", e.target.value)} />
          </div>
          <div className="ff">
            <label>Description</label>
            <textarea className="fta" placeholder="Describe the task…"
              value={f.description} onChange={(e) => s("description", e.target.value)} />
          </div>
          <div className="fr">
            <div className="ff">
              <label>Assign To</label>
              <select className="fse" value={f.assigneeId} onChange={(e) => s("assigneeId", e.target.value)}>
                {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="ff">
              <label>Priority</label>
              <select className="fse" value={f.priority} onChange={(e) => s("priority", e.target.value)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="fr">
            <div className="ff"><label>Task Date</label>
              <input className="fi2" type="date" value={f.date} onChange={(e) => s("date", e.target.value)} />
            </div>
            <div className="ff"><label>Due Date</label>
              <input className="fi2" type="date" value={f.dueDate} onChange={(e) => s("dueDate", e.target.value)} />
            </div>
          </div>
          <div className="fr">
            {task && (
              <div className="ff">
                <label>
                  Status
                  {enforceWorkflow && (
                    <span style={{ color: "var(--text3)", fontWeight: 400, fontSize: 11 }}> · workflow enforced</span>
                  )}
                </label>
                <select className="fse" value={f.status} onChange={(e) => s("status", e.target.value)}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => {
                    const allowed = canTransition({ fromStatus: task.status, toStatus: k, transitions, enforced: enforceWorkflow });
                    return (
                      <option key={k} value={k} disabled={!allowed}>
                        {v.label}{!allowed ? " (blocked)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            <div className="ff">
              <label>Sprint</label>
              <select className="fse" value={f.sprintId} onChange={(e) => s("sprintId", e.target.value)}>
                <option value="">📋 Backlog (no sprint)</option>
                {sprints.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.status === "active" ? "▶ " : sp.status === "completed" ? "✓ " : ""}{sp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mf">
            <button className="bg2" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="bs" onClick={submit} disabled={busy || !f.title.trim()}>
              {busy ? "Saving…" : task ? "Save Changes" : "Create & Assign"}
            </button>
          </div>
        </>
      )}

      {tab === "subtasks" && task && (
        <SubtaskPanel parentTask={task} emps={emps} onError={onError} />
      )}

      {tab === "remarks" && task && (
        <RemarkThread taskId={task.id} currentUser={currentUser} onError={onError} />
      )}

      {tab === "activity" && task && (
        <ActivityFeed taskId={task.id} onError={onError} />
      )}
    </Modal>
  );
}

function SubtaskPanel({ parentTask, emps, onError }) {
  const [children, setChildren] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    assigneeId: emps[0]?.id || "",
    date: today(),
    dueDate: today(),
    priority: "medium",
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.tasks.children(parentTask.id)
      .then(setChildren)
      .catch((err) => onError?.(err));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [parentTask.id]);

  const create = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.tasks.create({
        ...form,
        issueType: "subtask",
        parentId: parentTask.id,
      });
      setForm({ title: "", assigneeId: emps[0]?.id || "", date: today(), dueDate: today(), priority: "medium" });
      setShowForm(false);
      load();
    } catch (err) {
      onError?.(err);
    } finally {
      setSaving(false);
    }
  };

  const cfg = ISSUE_TYPE_CONFIG.subtask;

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--text2)" }}>
          {children == null ? "Loading…" : `${children.length} subtask${children.length === 1 ? "" : "s"}`}
        </span>
        <button className="bs" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add subtask"}
        </button>
      </div>

      {showForm && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div className="ff">
            <label>Title *</label>
            <input className="fi2" value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="What needs to be done?" />
          </div>
          <div className="fr">
            <div className="ff">
              <label>Assign To</label>
              <select className="fse" value={form.assigneeId}
                onChange={(e) => setForm((p) => ({ ...p, assigneeId: e.target.value }))}>
                {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="ff">
              <label>Priority</label>
              <select className="fse" value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="fr">
            <div className="ff"><label>Task Date</label>
              <input className="fi2" type="date" value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="ff"><label>Due Date</label>
              <input className="fi2" type="date" value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="mf">
            <button className="bs" disabled={saving || !form.title.trim()} onClick={create}>
              {saving ? "Creating…" : "Create Subtask"}
            </button>
          </div>
        </div>
      )}

      {children && children.length === 0 && (
        <div className="em"><div className="et2" style={{ fontSize: 13 }}>No subtasks yet</div></div>
      )}
      {children && children.map((c) => {
        const sc = STATUS_CONFIG[c.status];
        const emp = emps.find((e) => e.id === c.assigneeId);
        return (
          <div key={c.id} className="tr" style={{ borderLeftColor: cfg.color, marginBottom: 6 }}>
            <div style={{ fontSize: 16, marginTop: 2 }}>{cfg.icon}</div>
            <div className="tm">
              <div className="ttr">
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", marginRight: 6 }}>{c.issueKey}</span>
                <span className="tn">{c.title}</span>
                {sc && <span className="bg" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>}
              </div>
              <div className="tme">
                {emp && <span>👤 {emp.name}</span>}
                <span>⏰ Due {c.dueDate}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
