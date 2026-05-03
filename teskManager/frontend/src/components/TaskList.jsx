import { STATUS_CONFIG, PRIORITY, ISSUE_TYPE_CONFIG } from "../lib/constants.js";
import { groupTasks } from "../lib/hierarchy.js";
import { SubtaskRow } from "./SubtaskRow.jsx";
import { today as todayIso } from "../lib/dates.js";

export function TaskList({ tasks, emps, sprints = [], onEdit, onDel, onExt, onOpenRemarks, onUpdateStatus, isOwner }) {
  if (!tasks.length) {
    return <div className="em"><div className="ei">✦</div><div className="et2">No tasks found</div></div>;
  }
  const { topLevel, byParent } = groupTasks(tasks);
  const sprintsById = new Map(sprints.map((s) => [s.id, s]));
  const t0 = todayIso();

  return (
    <div className="tl">
      {topLevel.map((t) => {
        const sc = STATUS_CONFIG[t.status];
        const pr = PRIORITY[t.priority];
        const tc = ISSUE_TYPE_CONFIG[t.issueType] || ISSUE_TYPE_CONFIG.task;
        const emp = emps.find((e) => e.id === t.assigneeId);
        const sprint = t.sprintId ? sprintsById.get(t.sprintId) : null;
        const overdue = t.status !== "complete" && t.dueDate < t0;
        const children = byParent.get(t.id) || [];
        const childCount = children.length;
        const childDone = children.filter((c) => c.status === "complete").length;
        return (
          <div key={t.id} className="tg">
            <div className="tr" style={{ borderLeftColor: overdue ? "#ef4444" : tc.color }}>
              <div style={{ fontSize: 17, marginTop: 2, flexShrink: 0 }} title={tc.label}>{tc.icon}</div>
              <div className="tm">
                <div className="ttr">
                  {t.issueKey && (
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>{t.issueKey}</span>
                  )}
                  <span className="tn">{t.title}</span>
                  <span className="bg" style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                  {sc && <span className="bg" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>}
                  <span className="bg" style={{ background: `${pr.color}20`, color: pr.color }}>{pr.label}</span>
                  {t.extended && <span className="bg" style={{ background: "rgba(167,139,250,.15)", color: "#a78bfa" }}>Extended</span>}
                  {childCount > 0 && (
                    <span className="bg" style={{ background: "rgba(6,182,212,.15)", color: "#06b6d4" }} title="Subtask progress">
                      ╴ {childDone}/{childCount}
                    </span>
                  )}
                  {sprint && (
                    <span className="bg" style={{ background: "rgba(16,185,129,.15)", color: "#10b981" }} title={`Sprint: ${sprint.name}`}>
                      ⚡ {sprint.name}
                    </span>
                  )}
                  {overdue && (
                    <span className="bg" style={{ background: "rgba(239,68,68,.18)", color: "#ef4444" }}>⚠ Overdue</span>
                  )}
                </div>
                {t.description && <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, lineHeight: 1.4 }}>{t.description}</div>}
                <div className="tme">
                  {emp && <span>👤 {emp.name}</span>}
                  <span>📅 {t.date}</span>
                  <span style={{ color: overdue ? "#ef4444" : undefined, fontWeight: overdue ? 600 : undefined }}>
                    ⏰ Due {t.dueDate}
                  </span>
                </div>
              </div>
              <div className="ta">
                <button className="ib act" title="Remarks & activity" onClick={() => onOpenRemarks(t)}>💬</button>
                {isOwner && (
                  <>
                    <button className="ib" title="Extend +1d" onClick={() => onExt(t.id)}>⊕</button>
                    <button className="ib" title="Edit" onClick={() => onEdit(t)}>✎</button>
                    <button className="ib d" title="Delete" onClick={() => onDel(t.id)}>✕</button>
                  </>
                )}
              </div>
            </div>
            {children.length > 0 && (
              <div className="subs">
                {children.map((c) => (
                  <SubtaskRow
                    key={c.id}
                    task={c}
                    emps={emps}
                    onUpdateStatus={onUpdateStatus}
                    onEdit={isOwner ? onEdit : undefined}
                    onDel={isOwner ? onDel : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
