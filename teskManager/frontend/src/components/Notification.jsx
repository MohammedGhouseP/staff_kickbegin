export function TaskAssignedNotification({ notif, onClose }) {
  if (!notif) return null;
  return (
    <div className="no" onClick={onClose}>
      <div className="nc" onClick={(e) => e.stopPropagation()}>
        <div className="ni2">🔔</div>
        <div className="nh">New Task Assigned!</div>
        <div className="nta">{notif.task.title}</div>
        <div className="nsu">→ {notif.assignee?.name} · Due {notif.task.dueDate}</div>
        <button className="nb" onClick={onClose}>Got it! 👍</button>
      </div>
    </div>
  );
}
