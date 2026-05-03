import { useMemo, useState } from "react";
import { ISSUE_TYPE_CONFIG, STATUS_CONFIG } from "../lib/constants.js";
import { groupTasks } from "../lib/hierarchy.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const parseDate = (iso) => new Date(iso + "T00:00:00").getTime();
const fmtMonth = (d) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

// Compute date span across a tree. For an epic, span = epic's own range expanded
// to cover any children's ranges.
function spanOf(task, children) {
  let lo = parseDate(task.date);
  let hi = parseDate(task.dueDate);
  for (const c of children) {
    lo = Math.min(lo, parseDate(c.date));
    hi = Math.max(hi, parseDate(c.dueDate));
  }
  return { lo, hi };
}

export function RoadmapPage({ tasks, emps, onCardClick }) {
  const [filter, setFilter] = useState("all"); // all | epic | story+task+bug

  const { topLevel, byParent } = useMemo(() => groupTasks(tasks), [tasks]);

  // Roadmap rows: epics (and optionally top-level non-epics if no epics exist)
  const rows = useMemo(() => {
    const epics = topLevel.filter((t) => t.issueType === "epic");
    if (filter === "epic") return epics;
    if (filter === "items") return topLevel.filter((t) => t.issueType !== "epic");
    return epics.length ? epics : topLevel; // fallback: show top-level if no epics
  }, [topLevel, filter]);

  // Compute global date range from all visible tasks.
  const range = useMemo(() => {
    if (!rows.length) return null;
    let lo = Infinity, hi = -Infinity;
    for (const r of rows) {
      const kids = byParent.get(r.id) || [];
      const sp = spanOf(r, kids);
      lo = Math.min(lo, sp.lo);
      hi = Math.max(hi, sp.hi);
    }
    // Pad ±3 days for breathing room.
    lo -= 3 * DAY_MS;
    hi += 3 * DAY_MS;
    return { lo, hi, width: hi - lo };
  }, [rows, byParent]);

  // Build month tick marks across the timeline.
  const monthTicks = useMemo(() => {
    if (!range) return [];
    const ticks = [];
    const cur = new Date(range.lo);
    cur.setDate(1);
    cur.setHours(0, 0, 0, 0);
    while (cur.getTime() <= range.hi) {
      ticks.push({
        time: cur.getTime(),
        label: fmtMonth(cur),
        pct: ((cur.getTime() - range.lo) / range.width) * 100,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return ticks;
  }, [range]);

  const today = Date.now();
  const todayPct = range && today >= range.lo && today <= range.hi
    ? ((today - range.lo) / range.width) * 100
    : null;

  if (!rows.length) {
    return (
      <>
        <div className="ph"><div className="pt">Roadmap</div><div className="ps">Plan epics across time</div></div>
        <div className="em"><div className="ei">⚡</div><div className="et2">No epics yet. Create an Epic to start your roadmap.</div></div>
      </>
    );
  }

  const barFor = (task) => {
    const lo = parseDate(task.date);
    const hi = parseDate(task.dueDate);
    const left = ((lo - range.lo) / range.width) * 100;
    const width = ((hi - lo) / range.width) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 1.5)}%` };
  };

  return (
    <>
      <div className="ph">
        <div className="pt">Roadmap</div>
        <div className="ps">Plan epics across time</div>
      </div>

      <div className="tb">
        <div className="tbl">
          <select className="fse" style={{ width: 200 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Auto (epics or top-level)</option>
            <option value="epic">Epics only</option>
            <option value="items">Top-level items (story/task/bug)</option>
          </select>
        </div>
      </div>

      <div className="rmw">
        <div className="rmaxis">
          <div className="rmaxlabel" />
          <div className="rmaxbar">
            {monthTicks.map((t) => (
              <div key={t.time} className="rmtick" style={{ left: t.pct + "%" }}>
                <div className="rmtickline" />
                <div className="rmticklabel">{t.label}</div>
              </div>
            ))}
            {todayPct != null && (
              <div className="rmtoday" style={{ left: todayPct + "%" }} title="Today" />
            )}
          </div>
        </div>

        <div className="rmrows">
          {rows.map((t) => {
            const tc = ISSUE_TYPE_CONFIG[t.issueType] || ISSUE_TYPE_CONFIG.task;
            const kids = byParent.get(t.id) || [];
            const sc = STATUS_CONFIG[t.status];
            const emp = emps.find((e) => e.id === t.assigneeId);
            const bar = barFor(t);
            return (
              <div key={t.id}>
                <div className="rmrow">
                  <div className="rmlabel">
                    <span style={{ fontSize: 14 }}>{tc.icon}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)" }}>{t.issueKey}</span>
                    <span className="rmlt" title={t.title}>{t.title}</span>
                  </div>
                  <div className="rmtrack">
                    <div
                      className="rmbar"
                      style={{ ...bar, background: tc.color, opacity: t.status === "complete" ? 0.55 : 1 }}
                      onClick={() => onCardClick?.(t)}
                      title={`${t.date} → ${t.dueDate}`}
                    >
                      <span className="rmbartxt">{t.title}</span>
                      {emp && (
                        <span className="rmbarav" style={{ background: emp.color || "#6c8ef5" }} title={emp.name}>
                          {emp.name[0]}
                        </span>
                      )}
                      {sc && <span className="rmbarstatus" style={{ color: sc.color }}>{sc.icon}</span>}
                    </div>
                  </div>
                </div>
                {kids.map((c) => {
                  const cc = ISSUE_TYPE_CONFIG[c.issueType] || ISSUE_TYPE_CONFIG.task;
                  const cb = barFor(c);
                  return (
                    <div key={c.id} className="rmrow rmrowsub">
                      <div className="rmlabel">
                        <span className="rmlbranch">└</span>
                        <span style={{ fontSize: 12 }}>{cc.icon}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)" }}>{c.issueKey}</span>
                        <span className="rmlt" style={{ fontSize: 12, color: "var(--text2)" }} title={c.title}>{c.title}</span>
                      </div>
                      <div className="rmtrack">
                        <div
                          className="rmbar rmbarsub"
                          style={{ ...cb, background: cc.color, opacity: c.status === "complete" ? 0.55 : 0.85 }}
                          onClick={() => onCardClick?.(c)}
                          title={`${c.date} → ${c.dueDate}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
