import { useEffect, useState } from "react";
import { STATUS_CONFIG, PRIORITY, ISSUE_TYPE_CONFIG } from "../lib/constants.js";
import { RemarkThread } from "./RemarkThread.jsx";
import { api } from "../lib/api.js";
import { canTransition } from "../lib/hierarchy.js";

export function EmpRow({ task, currentUser, transitions, sprint, today, enforceWorkflow, onUpdateStatus, onEdit, onExtend, onDelete, onError }) {
  const [showRemarks, setShowRemarks] = useState(false);
  const [childCounts, setChildCounts] = useState(null);
  const sc = STATUS_CONFIG[task.status];
  const pr = PRIORITY[task.priority];
  const tc = ISSUE_TYPE_CONFIG[task.issueType] || ISSUE_TYPE_CONFIG.task;
  const overdue = today && task.status !== "complete" && task.dueDate < today;
  const dueToday = today && task.status !== "complete" && task.dueDate === today;

  // Fetch subtask progress for parent-eligible types so the user sees X/Y at a glance.
  useEffect(() => {
    let cancelled = false;
    if (!["story", "task", "bug"].includes(task.issueType)) {
      setChildCounts(null);
      return;
    }
    api.tasks.children(task.id)
      .then((rows) => {
        if (cancelled) return;
        setChildCounts({ done: rows.filter((r) => r.status === "complete").length, total: rows.length });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [task.id, task.issueType, task.status]);

  return (
    <div className="tr" style={{ borderLeftColor: overdue ? "#ef4444" : tc.color, cursor: "default", flexDirection: "column", alignItems: "stretch", boxShadow: overdue ? "inset 4px 0 0 rgba(239,68,68,.18)" : undefined }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
        <div style={{ fontSize: 19, marginTop: 2, flexShrink: 0 }} title={tc.label}>{tc.icon}</div>
        <div className="tm">
          <div className="ttr">
            {task.issueKey && (
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>{task.issueKey}</span>
            )}
            <span className="tn">{task.title}</span>
            <span className="bg" style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
            <span className="bg" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
            <span className="bg" style={{ background: `${pr.color}20`, color: pr.color }}>{pr.label}</span>
            {task.extended && <span className="bg" style={{ background: "rgba(167,139,250,.15)", color: "#a78bfa" }}>Extended</span>}
            {childCounts && childCounts.total > 0 && (
              <span className="bg" style={{ background: "rgba(6,182,212,.15)", color: "#06b6d4" }} title="Subtask progress">
                ╴ {childCounts.done}/{childCounts.total}
              </span>
            )}
            {sprint && (
              <span className="bg" style={{ background: "rgba(16,185,129,.15)", color: "#10b981" }} title={`Sprint: ${sprint.name}`}>
                ⚡ {sprint.name}
              </span>
            )}
            {overdue && (
              <span className="bg" style={{ background: "rgba(239,68,68,.18)", color: "#ef4444" }} title={`Was due ${task.dueDate}`}>
                ⚠ Overdue
              </span>
            )}
            {dueToday && !overdue && (
              <span className="bg" style={{ background: "rgba(245,158,11,.18)", color: "#f59e0b" }}>
                Due today
              </span>
            )}
          </div>
          {task.description && (
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 7, lineHeight: 1.5 }}>{task.description}</div>
          )}
          <div className="tme" style={{ marginBottom: 9 }}>
            <span>📅 {task.date}</span>
            <span style={{ color: overdue ? "#ef4444" : undefined, fontWeight: overdue ? 600 : undefined }}>
              ⏰ Due {task.dueDate}
            </span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text3)", marginBottom: 5 }}>
            Update Status
          </div>
          <div className="ss2">
            {Object.entries(STATUS_CONFIG).map(([k, c]) => {
              const allowed = canTransition({ fromStatus: task.status, toStatus: k, transitions, enforced: enforceWorkflow });
              return (
                <button
                  key={k}
                  className="so"
                  disabled={!allowed}
                  title={!allowed ? `Transition ${task.status} → ${k} is blocked by workflow` : ""}
                  style={{
                    borderColor: task.status === k ? c.color : "var(--border2)",
                    color: task.status === k ? c.color : "var(--text2)",
                    background: task.status === k ? c.bg : "transparent",
                    opacity: allowed ? 1 : 0.4,
                    cursor: allowed ? "pointer" : "not-allowed",
                  }}
                  onClick={() => allowed && onUpdateStatus(task.id, k)}
                >
                  {c.icon} {c.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="ta">
          <button
            className={`ib ${showRemarks ? "act" : ""}`}
            title="Remarks"
            onClick={() => setShowRemarks((v) => !v)}
          >
            💬
          </button>
          {onExtend && (
            <button className="ib" title="Extend +1d" onClick={() => onExtend(task.id)}>⊕</button>
          )}
          {onEdit && (
            <button className="ib" title="Edit" onClick={() => onEdit(task)}>✎</button>
          )}
          {onDelete && (
            <button className="ib d" title="Delete" onClick={() => onDelete(task.id)}>✕</button>
          )}
        </div>
      </div>
      {showRemarks && <RemarkThread taskId={task.id} currentUser={currentUser} onError={onError} />}
    </div>
  );
}
