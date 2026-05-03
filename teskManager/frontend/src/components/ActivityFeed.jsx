import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { fmtRelative } from "../lib/dates.js";

const describe = (a) => {
  const d = a.details || {};
  switch (a.action) {
    case "created":         return "created the task";
    case "status_changed":  return `changed status from ${d.from} → ${d.to}`;
    case "extended":        return `extended due date to ${d.dueDate}`;
    case "type_changed":    return `changed issue type from ${d.from} → ${d.to}`;
    case "parent_changed":
      if (!d.from && d.to)  return `linked under parent`;
      if (d.from && !d.to)  return `unlinked from parent`;
      return `moved to a different parent`;
    case "sprint_changed":
      if (!d.from && d.to)  return `moved into a sprint`;
      if (d.from && !d.to)  return `moved back to the backlog`;
      return `moved to a different sprint`;
    default:                return a.action;
  }
};

export function ActivityFeed({ taskId, onError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.tasks.activity(taskId)
      .then((r) => { if (!cancelled) setItems(r); })
      .catch((e) => onError?.(e.message))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [taskId, onError]);

  return (
    <div className="rmk">
      <div className="rmk-h"><span>Activity</span></div>
      <div className="act-list">
        {loading
          ? <div className="rmk-empty">Loading…</div>
          : items.length === 0
            ? <div className="rmk-empty">No activity yet.</div>
            : items.map((a) => (
                <div key={a.id} className="act-it">
                  <div className="act-av" style={{ background: a.actorColor || "#6c8ef5" }}>
                    {a.actorName?.[0]?.toUpperCase()}
                  </div>
                  <div className="act-bd">
                    <strong style={{ color: "var(--text0)" }}>{a.actorName}</strong> {describe(a)}
                    <div className="act-tm">{fmtRelative(a.createdAt)}</div>
                  </div>
                </div>
              ))
        }
      </div>
    </div>
  );
}
