import { useEffect, useMemo, useState } from "react";
import { ISSUE_TYPE_CONFIG, STATUS_CONFIG, PRIORITY } from "../lib/constants.js";
import { api } from "../lib/api.js";

// Compute a new rank for a card being inserted at a given position in a sorted list.
// list is the destination's CURRENT items in rank order, beforeIndex is the index where
// the card should land (0 = top, list.length = bottom).
function rankAt(list, beforeIndex) {
  if (list.length === 0) return 1024;
  if (beforeIndex <= 0) return list[0].rank - 1024;
  if (beforeIndex >= list.length) return list[list.length - 1].rank + 1024;
  return (list[beforeIndex - 1].rank + list[beforeIndex].rank) / 2;
}

export function BacklogPage({ tasks, emps, actions, onCardClick, onError }) {
  const [sprints, setSprints] = useState([]);
  const [drag, setDrag] = useState(null); // { id, fromCol }
  const [dropHint, setDropHint] = useState(null); // { col, beforeIndex }

  useEffect(() => { api.sprints.list().then(setSprints).catch(() => {}); }, []);

  const visible = useMemo(() => tasks.filter((t) => !t.parentId), [tasks]);
  const activeSprints = useMemo(() => sprints.filter((s) => s.status === "active"), [sprints]);

  // Lists per column, rank-sorted.
  const byCol = useMemo(() => {
    const cols = { backlog: [] };
    for (const s of activeSprints) cols[s.id] = [];
    for (const t of visible) {
      const key = t.sprintId && cols[t.sprintId] ? t.sprintId : "backlog";
      cols[key].push(t);
    }
    for (const k in cols) cols[k].sort((a, b) => a.rank - b.rank);
    return cols;
  }, [visible, activeSprints]);

  const onDragStart = (e, t, fromCol) => {
    setDrag({ id: t.id, fromCol });
    e.dataTransfer.setData("text/plain", t.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnd = () => { setDrag(null); setDropHint(null); };

  const handleDrop = async (col) => {
    if (!drag || !dropHint || dropHint.col !== col) {
      setDrag(null); setDropHint(null);
      return;
    }
    const dest = byCol[col] || [];
    const filtered = dest.filter((x) => x.id !== drag.id);
    const newRank = rankAt(filtered, dropHint.beforeIndex);
    const patch = { rank: newRank };
    if (col === "backlog") patch.sprintId = null;
    else patch.sprintId = col;
    setDrag(null); setDropHint(null);
    try {
      await actions.updateTask(drag.id, patch);
    } catch (err) { onError?.(err); }
  };

  const renderCol = (col, title, subtitle, color) => {
    const items = byCol[col] || [];
    return (
      <div
        key={col}
        className={`bkcol ${dropHint?.col === col ? "dragover" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          // Default drop position = bottom; specific row handlers will override beforeIndex.
          if (!dropHint || dropHint.col !== col) setDropHint({ col, beforeIndex: items.length });
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setDropHint((d) => d?.col === col ? null : d);
          }
        }}
        onDrop={() => handleDrop(col)}
      >
        <div className="bkh" style={{ borderTopColor: color }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="bkhl">{title}</span>
            <span className="brdhn">{items.length}</span>
          </div>
          {subtitle && <span className="bkhs">{subtitle}</span>}
        </div>
        <div className="bkcards">
          {items.length === 0 && <div className="brdempty">Drop tasks here</div>}
          {items.map((t, idx) => {
            const tc = ISSUE_TYPE_CONFIG[t.issueType] || ISSUE_TYPE_CONFIG.task;
            const sc = STATUS_CONFIG[t.status];
            const pr = PRIORITY[t.priority];
            const emp = emps.find((e) => e.id === t.assigneeId);
            const showHintAbove = dropHint?.col === col && dropHint.beforeIndex === idx && drag?.id !== t.id;
            return (
              <div key={t.id}>
                {showHintAbove && <div className="bkhint" />}
                <div
                  className="bkcard"
                  style={{ borderLeftColor: tc.color, opacity: drag?.id === t.id ? 0.35 : 1 }}
                  draggable
                  onDragStart={(e) => onDragStart(e, t, col)}
                  onDragEnd={onDragEnd}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const above = e.clientY < rect.top + rect.height / 2;
                    setDropHint({ col, beforeIndex: above ? idx : idx + 1 });
                  }}
                  onClick={() => onCardClick?.(t)}
                >
                  <div className="bkcardh">
                    <span className="brdtype" title={tc.label}>{tc.icon}</span>
                    <span className="brdkey">{t.issueKey}</span>
                    <span className="brdpd" style={{ background: pr.color }} title={pr.label} />
                  </div>
                  <div className="bkcardt">{t.title}</div>
                  <div className="bkcardf">
                    {emp && (
                      <span className="suav" style={{ background: emp.color || "#6c8ef5", width: 20, height: 20, fontSize: 10 }} title={emp.name}>
                        {emp.name[0]}
                      </span>
                    )}
                    {sc && <span className="bg" style={{ background: sc.bg, color: sc.color, fontSize: 9 }}>{sc.label}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {dropHint?.col === col && dropHint.beforeIndex === items.length && drag && (
            <div className="bkhint" />
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="ph">
        <div className="pt">Backlog</div>
        <div className="ps">Drag cards within the backlog to prioritize, or into a sprint to commit them</div>
      </div>
      {activeSprints.length === 0 && (
        <div className="bkhint-msg">No active sprints. Start a sprint to drag tasks into it.</div>
      )}
      <div className="bkc">
        {renderCol("backlog", "Product Backlog", "All un-sprinted tasks", "#8892b0")}
        {activeSprints.map((s) => renderCol(s.id, s.name, `${s.startDate} → ${s.endDate}`, "#10b981"))}
      </div>
    </>
  );
}
