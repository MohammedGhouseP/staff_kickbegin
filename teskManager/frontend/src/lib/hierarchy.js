export const isAdminOrOwner = (user) => user?.role === "owner" || user?.role === "admin";

// Returns true if moving from `fromStatus` to `toStatus` is allowed under the
// current workflow rules. When enforcement is off, everything is allowed.
// Self-transitions are always allowed (no-op).
export function canTransition({ fromStatus, toStatus, transitions, enforced }) {
  if (fromStatus === toStatus) return true;
  if (!enforced) return true;
  return (transitions || []).some((t) => {
    const f = t.from || t.fromStatus;
    const to = t.to || t.toStatus;
    return f === fromStatus && to === toStatus;
  });
}

// Group a flat task list into top-level + children-by-parent.
// A subtask whose parent isn't in the same list (orphan or parent filtered out)
// is promoted to top-level so it doesn't disappear from the UI.
export function groupTasks(tasks) {
  const byParent = new Map();
  const topLevel = [];
  const ids = new Set(tasks.map((t) => t.id));
  for (const t of tasks) {
    if (t.parentId && ids.has(t.parentId)) {
      const arr = byParent.get(t.parentId) || [];
      arr.push(t);
      byParent.set(t.parentId, arr);
    } else {
      topLevel.push(t);
    }
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  }
  return { topLevel, byParent };
}
