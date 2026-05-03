import { STATUS_CONFIG, ISSUE_TYPE_CONFIG } from "../lib/constants.js";

const STATUS_ORDER = ["yet-to-start", "in-progress", "complete"];

export function SubtaskRow({ task, emps, onUpdateStatus, onEdit, onDel }) {
  const sc = STATUS_CONFIG[task.status];
  const tc = ISSUE_TYPE_CONFIG[task.issueType] || ISSUE_TYPE_CONFIG.subtask;
  const emp = emps?.find((e) => e.id === task.assigneeId);

  const cycleStatus = (e) => {
    e.stopPropagation();
    if (!onUpdateStatus) return;
    const i = STATUS_ORDER.indexOf(task.status);
    const next = STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
    onUpdateStatus(task.id, next);
  };

  return (
    <div className="subrow" style={{ borderLeftColor: tc.color }}>
      <span className="suri" title={tc.label}>{tc.icon}</span>
      {task.issueKey && <span className="surk">{task.issueKey}</span>}
      <span
        className="surt"
        onClick={onEdit ? () => onEdit(task) : undefined}
        style={onEdit ? { cursor: "pointer" } : undefined}
      >
        {task.title}
      </span>
      {sc && (
        <span
          className="bg surb"
          style={{ background: sc.bg, color: sc.color, cursor: onUpdateStatus ? "pointer" : "default" }}
          onClick={onUpdateStatus ? cycleStatus : undefined}
          title={onUpdateStatus ? "Click to cycle status" : sc.label}
        >
          {sc.icon} {sc.label}
        </span>
      )}
      {emp && (
        <span className="suav" style={{ background: emp.color || "#6c8ef5" }} title={emp.name}>
          {emp.name[0]}
        </span>
      )}
      {onDel && (
        <button className="ib d sib" title="Delete subtask" onClick={() => onDel(task.id)}>✕</button>
      )}
    </div>
  );
}
