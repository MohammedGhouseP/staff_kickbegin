import { useEffect, useMemo, useState } from "react";
import { STATUS_CONFIG, ISSUE_TYPE_CONFIG, PRIORITY } from "../lib/constants.js";
import { api } from "../lib/api.js";

const COLUMN_ORDER = ["yet-to-start", "in-progress", "complete"];

export function Board({ tasks, emps, onCardClick, onMoveStatus, onError }) {
  const [search, setSearch] = useState("");
  const [filterEmp, setFilterEmp] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterSprint, setFilterSprint] = useState("all"); // 'all' | 'backlog' | sprintId
  const [sprints, setSprints] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  useEffect(() => {
    api.sprints.list().then(setSprints).catch(() => {});
  }, [tasks.length]);

  const visible = useMemo(() => {
    return tasks.filter((t) => {
      if (t.parentId) return false; // hide subtasks from board
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterEmp !== "all" && t.assigneeId !== filterEmp) return false;
      if (filterType !== "all" && t.issueType !== filterType) return false;
      if (filterSprint === "backlog" && t.sprintId) return false;
      if (filterSprint !== "all" && filterSprint !== "backlog" && t.sprintId !== filterSprint) return false;
      return true;
    });
  }, [tasks, search, filterEmp, filterType, filterSprint]);

  const byStatus = useMemo(() => {
    const groups = Object.fromEntries(COLUMN_ORDER.map((s) => [s, []]));
    for (const t of visible) {
      if (groups[t.status]) groups[t.status].push(t);
    }
    return groups;
  }, [visible]);

  const onDrop = async (e, status) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = dragId || e.dataTransfer.getData("text/plain");
    setDragId(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    try { await onMoveStatus(id, status); }
    catch (err) { onError?.(err); }
  };

  return (
    <div className="brd">
      <div className="brdf">
        <input
          className="fi2"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        <select className="fse" value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)} style={{ width: 160 }}>
          <option value="all">All assignees</option>
          {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select className="fse" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 140 }}>
          <option value="all">All types</option>
          {Object.entries(ISSUE_TYPE_CONFIG).filter(([k]) => k !== "subtask").map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        <select className="fse" value={filterSprint} onChange={(e) => setFilterSprint(e.target.value)} style={{ width: 180 }}>
          <option value="all">All sprints + backlog</option>
          <option value="backlog">📋 Backlog (no sprint)</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>
              {s.status === "active" ? "▶ " : s.status === "completed" ? "✓ " : ""}{s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="brdc">
        {COLUMN_ORDER.map((status) => {
          const col = byStatus[status];
          const sc = STATUS_CONFIG[status];
          return (
            <div
              key={status}
              className={`brdcol ${dragOverCol === status ? "dragover" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(status); }}
              onDragLeave={() => setDragOverCol((c) => c === status ? null : c)}
              onDrop={(e) => onDrop(e, status)}
            >
              <div className="brdh" style={{ borderTopColor: sc.color }}>
                <span className="brdhi" style={{ color: sc.color }}>{sc.icon}</span>
                <span className="brdhl">{sc.label}</span>
                <span className="brdhn">{col.length}</span>
              </div>
              <div className="brdcards">
                {col.length === 0 && (
                  <div className="brdempty">Drop tasks here</div>
                )}
                {col.map((t) => {
                  const tc = ISSUE_TYPE_CONFIG[t.issueType] || ISSUE_TYPE_CONFIG.task;
                  const pr = PRIORITY[t.priority];
                  const emp = emps.find((e) => e.id === t.assigneeId);
                  return (
                    <div
                      key={t.id}
                      className="brdcard"
                      style={{ borderLeftColor: tc.color, opacity: dragId === t.id ? 0.4 : 1 }}
                      draggable
                      onDragStart={(e) => { setDragId(t.id); e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; }}
                      onDragEnd={() => { setDragId(null); setDragOverCol(null); }}
                      onClick={() => onCardClick?.(t)}
                    >
                      <div className="brdcardh">
                        <span className="brdtype" title={tc.label}>{tc.icon}</span>
                        <span className="brdkey">{t.issueKey}</span>
                        <span className="brdpd" style={{ background: pr.color }} title={pr.label + " priority"} />
                      </div>
                      <div className="brdcardt">{t.title}</div>
                      <div className="brdcardf">
                        {emp && (
                          <span className="suav" style={{ background: emp.color || "#6c8ef5", width: 22, height: 22, fontSize: 10 }} title={emp.name}>
                            {emp.name[0]}
                          </span>
                        )}
                        <span className="brdcardd">⏰ {t.dueDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
