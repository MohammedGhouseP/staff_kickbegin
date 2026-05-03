export const STATUS_CONFIG = {
  "yet-to-start": { label: "Yet to Start", color: "#6366f1", bg: "rgba(99,102,241,0.15)", icon: "○" },
  "in-progress":  { label: "In Progress",  color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: "◐" },
  "complete":     { label: "Complete",     color: "#10b981", bg: "rgba(16,185,129,0.15)", icon: "●" },
};

export const ISSUE_TYPE_CONFIG = {
  epic:    { label: "Epic",    color: "#a78bfa", bg: "rgba(167,139,250,0.15)", icon: "⚡" },
  story:   { label: "Story",   color: "#10b981", bg: "rgba(16,185,129,0.15)",  icon: "▣" },
  task:    { label: "Task",    color: "#3b82f6", bg: "rgba(59,130,246,0.15)",  icon: "☐" },
  bug:     { label: "Bug",     color: "#ef4444", bg: "rgba(239,68,68,0.15)",   icon: "🐞" },
  subtask: { label: "Subtask", color: "#06b6d4", bg: "rgba(6,182,212,0.15)",   icon: "╴" },
};

// Allowed parent types for a given child type. [] means no parent allowed.
export function validParentTypes(childType) {
  switch (childType) {
    case "epic":    return [];
    case "story":
    case "task":
    case "bug":     return ["epic"];
    case "subtask": return ["story", "task", "bug"];
    default:        return [];
  }
}

export const PRIORITY = {
  high:   { label: "High",   color: "#ef4444" },
  medium: { label: "Medium", color: "#f59e0b" },
  low:    { label: "Low",    color: "#10b981" },
};

export const AVATAR_COLORS = [
  "#6c8ef5", "#f59e0b", "#10b981", "#ef4444", "#a78bfa",
  "#2dd4bf", "#f97316", "#ec4899", "#84cc16", "#06b6d4",
];

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
