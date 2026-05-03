import { useMemo, useState } from "react";
import { Sidebar } from "./Sidebar.jsx";
import { EmpRow } from "./EmpRow.jsx";
import { SubtaskRow } from "./SubtaskRow.jsx";
import { TaskModal } from "./TaskModal.jsx";
import { UserModal } from "./UserModal.jsx";
import { ConfirmDialog } from "./Modal.jsx";
import { DAY_LABELS, STATUS_CONFIG } from "../lib/constants.js";
import { groupTasks } from "../lib/hierarchy.js";
import { today, addDays, getWeekDates } from "../lib/dates.js";

export function EmployeeApp({ me, tasks, perms, transitions, sprints = [], actions, onLogout, onError }) {
  const [view, setView] = useState("day");
  const [weekBase, setWeekBase] = useState(new Date());
  const [selDay, setSelDay] = useState(today());
  const [sbOpen, setSbOpen] = useState(false);
  const [taskMod, setTaskMod] = useState(null);
  const [delTask, setDelTask] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const myTasks = useMemo(() => tasks.filter((t) => t.assigneeId === me.id), [tasks, me.id]);
  const sprintsById = useMemo(() => {
    const m = new Map();
    for (const s of sprints) m.set(s.id, s);
    return m;
  }, [sprints]);

  const t0 = today();
  const overdueCount = useMemo(
    () => myTasks.filter((t) => t.status !== "complete" && t.dueDate < t0).length,
    [myTasks, t0]
  );

  const handleSaveTask = async (data) => {
    setBusy(true);
    try {
      if (taskMod?.task) await actions.updateTask(taskMod.task.id, data);
      else await actions.createTask({ ...data, assigneeId: me.id });
      setTaskMod(null);
    } catch {} finally { setBusy(false); }
  };

  const handleSaveProfile = async (data) => {
    setBusy(true);
    try {
      await actions.updateUser(me.id, data, true);
      setProfileOpen(false);
    } catch {} finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    if (!delTask) return;
    setBusy(true);
    try { await actions.deleteTask(delTask); } catch {} finally { setBusy(false); setDelTask(null); }
  };

  const canDay = perms.dayView;
  const canWeek = perms.weekView;
  const eff = (view === "day" && canDay) ? "day"
            : (view === "week" && canWeek) ? "week"
            : canDay ? "day"
            : canWeek ? "week"
            : "none";

  const weekDates = getWeekDates(weekBase);
  const searching = search.trim().length > 0;
  const matchesSearch = (t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (t.title || "").toLowerCase().includes(q) || (t.issueKey || "").toLowerCase().includes(q);
  };
  const dayTasks = searching
    ? myTasks.filter(matchesSearch)
    : myTasks.filter((t) => t.date === selDay);

  const updateStatus = (id, status) => actions.updateTask(id, { status }).catch(() => {});

  const stats = [
    { l: "Total",   v: myTasks.length,                                              ac: "var(--accent)" },
    { l: "Done",    v: myTasks.filter((t) => t.status === "complete").length,       ac: "#10b981" },
    { l: "Overdue", v: overdueCount,                                                ac: "#ef4444" },
    { l: "Pending", v: myTasks.filter((t) => t.status === "yet-to-start").length,   ac: "#f59e0b" },
  ];

  return (
    <div className="shell">
      <div className="topbar">
        <div className="topbar-logo">TASKFLOW</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="av" style={{ background: me.color || "#10b981", width: 28, height: 28, fontSize: 11 }}>{me.name[0]}</div>
          <button className="hbg" onClick={() => setSbOpen(true)}><span /><span /><span /></button>
        </div>
      </div>

      <Sidebar me={me} page="tasks" setPage={() => {}} navItems={[]} onLogout={onLogout} open={sbOpen} setOpen={setSbOpen}>
        <div className="ns" style={{ marginTop: 16 }}>My Stats</div>
        <div style={{ padding: "4px 0", display: "flex", flexDirection: "column", gap: 7 }}>
          {stats.map((s) => (
            <div key={s.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 9px", background: "var(--bg2)", borderRadius: 7 }}>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>{s.l}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.ac, fontFamily: "var(--mono)" }}>{s.v}</span>
            </div>
          ))}
        </div>
        <button
          className="bg2"
          style={{ marginTop: 14, width: "100%" }}
          onClick={() => setProfileOpen(true)}
        >
          ⚙ Edit Profile
        </button>
      </Sidebar>

      <div className="main">
        <div className="ph" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="pt">Hey, {me.name.split(" ")[0]} 👋</div>
            <div className="ps">Your assigned tasks{overdueCount > 0 && ` · ${overdueCount} overdue`}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {perms.empCanCreateTask && (
              <button className="bn" onClick={() => setTaskMod({})}>＋ New Task</button>
            )}
            <button className="bg2" onClick={() => setProfileOpen(true)} title="Edit profile">⚙</button>
          </div>
        </div>
        <div className="sg" style={{ marginBottom: 18 }}>
          {stats.map((s) => (
            <div className="sc" key={s.l} style={{ "--ac": s.ac }}>
              <div className="sl">{s.l}</div>
              <div className="sv">{s.v}</div>
            </div>
          ))}
        </div>

        {eff === "none" ? (
          <div className="em"><div className="ei">🔒</div><div className="et2">Owner has restricted task view access.</div></div>
        ) : (
          <>
            <div className="tb">
              <div className="vt">
                {canDay && <button className={`vb ${eff === "day" ? "a" : ""}`} onClick={() => setView("day")}>Day</button>}
                {canWeek && <button className={`vb ${eff === "week" ? "a" : ""}`} onClick={() => setView("week")}>Week</button>}
              </div>
              <div className="sx" style={{ marginLeft: "auto", maxWidth: 320 }}>
                <span style={{ color: "var(--text3)", fontSize: 14 }}>⌕</span>
                <input
                  placeholder="Search by title or TF-N…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 12, padding: "0 4px" }}
                    onClick={() => setSearch("")}
                    title="Clear"
                  >✕</button>
                )}
              </div>
            </div>

            {searching ? (
              <>
                <div className="dn2"><div className="dtit">Search results <span style={{ color: "var(--text2)", fontWeight: 400, fontSize: 13 }}>· {dayTasks.length} match{dayTasks.length === 1 ? "" : "es"}</span></div></div>
                {!dayTasks.length ? (
                  <div className="em"><div className="ei">🔍</div><div className="et2">No tasks match "{search}".</div></div>
                ) : (
                  <div className="tl">
                    {(() => {
                      const { topLevel, byParent } = groupTasks(dayTasks);
                      return topLevel.map((t) => {
                        const children = byParent.get(t.id) || [];
                        return (
                          <div key={t.id} className="tg">
                            <EmpRow
                              task={t}
                              currentUser={me}
                              transitions={transitions}
                              sprint={t.sprintId ? sprintsById.get(t.sprintId) : null}
                              today={t0}
                              enforceWorkflow={!!perms.enforceWorkflow}
                              onUpdateStatus={updateStatus}
                              onError={onError}
                              onEdit={perms.empCanEditOwnTask ? (t) => setTaskMod({ task: t }) : undefined}
                              onExtend={perms.empCanExtendOwnTask ? (id) => actions.extendTask(id).catch(() => {}) : undefined}
                              onDelete={perms.empCanDeleteOwnTask ? (id) => setDelTask(id) : undefined}
                            />
                            {children.length > 0 && (
                              <div className="subs">
                                {children.map((c) => (
                                  <SubtaskRow key={c.id} task={c} onUpdateStatus={updateStatus} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </>
            ) : eff === "week" ? (
              <>
                <div className="wn">
                  <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); }}>‹ Prev</button>
                  <span className="wl">
                    {new Date(weekDates[0] + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" – "}
                    {new Date(weekDates[6] + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); }}>Next ›</button>
                </div>
                <div className="wg">
                  {weekDates.map((date, i) => {
                    const isT = date === t0;
                    const dayT = myTasks.filter((t) => t.date === date && !t.parentId);
                    return (
                      <div key={date} className={`dc ${isT ? "tod" : ""}`}>
                        <div className="dh">
                          <div className="dname">{DAY_LABELS[i]}</div>
                          <div className="dn">{new Date(date + "T00:00:00").getDate()}</div>
                        </div>
                        <div className="dts">
                          {dayT.map((t) => {
                            const sc = STATUS_CONFIG[t.status];
                            const overdue = t.status !== "complete" && t.dueDate < t0;
                            return (
                              <div
                                key={t.id}
                                className="mt"
                                style={{ borderColor: overdue ? "#ef4444" : sc.color, background: overdue ? "rgba(239,68,68,.12)" : sc.bg }}
                                onClick={() => { setSelDay(date); setView("day"); }}
                                title={overdue ? `Overdue · due ${t.dueDate}` : ""}
                              >
                                {t.title}
                              </div>
                            );
                          })}
                          {!dayT.length && <div style={{ fontSize: 10, color: "var(--text3)", padding: "5px", textAlign: "center" }}>—</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="dn2">
                  <button className="dnb" onClick={() => setSelDay(addDays(selDay, -1))}>‹</button>
                  <div className="dtit">
                    {new Date(selDay + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    {selDay === t0 && <span className="tb2">TODAY</span>}
                  </div>
                  <button className="dnb" onClick={() => setSelDay(addDays(selDay, 1))}>›</button>
                </div>
                {!dayTasks.length ? (
                  <div className="em"><div className="ei">✦</div><div className="et2">No tasks for this day.</div></div>
                ) : (
                  <div className="tl">
                    {(() => {
                      const { topLevel, byParent } = groupTasks(dayTasks);
                      return topLevel.map((t) => {
                        const children = byParent.get(t.id) || [];
                        return (
                          <div key={t.id} className="tg">
                            <EmpRow
                              task={t}
                              currentUser={me}
                              transitions={transitions}
                              sprint={t.sprintId ? sprintsById.get(t.sprintId) : null}
                              today={t0}
                              enforceWorkflow={!!perms.enforceWorkflow}
                              onUpdateStatus={updateStatus}
                              onError={onError}
                              onEdit={perms.empCanEditOwnTask ? (t) => setTaskMod({ task: t }) : undefined}
                              onExtend={perms.empCanExtendOwnTask ? (id) => actions.extendTask(id).catch(() => {}) : undefined}
                              onDelete={perms.empCanDeleteOwnTask ? (id) => setDelTask(id) : undefined}
                            />
                            {children.length > 0 && (
                              <div className="subs">
                                {children.map((c) => (
                                  <SubtaskRow key={c.id} task={c} onUpdateStatus={updateStatus} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {taskMod !== null && (
        <TaskModal
          task={taskMod.task}
          emps={[me]}
          currentUser={me}
          transitions={transitions}
          enforceWorkflow={!!perms.enforceWorkflow}
          onSave={handleSaveTask}
          onClose={() => setTaskMod(null)}
          onError={onError}
          busy={busy}
        />
      )}

      {profileOpen && (
        <UserModal
          user={me}
          isSelf
          currentUserRole={me.role}
          onSave={handleSaveProfile}
          onClose={() => setProfileOpen(false)}
          busy={busy}
        />
      )}

      {delTask && (
        <ConfirmDialog
          icon="🗑"
          title="Delete this task?"
          message="This task will be permanently deleted along with its remarks and activity log."
          confirmLabel="Delete task"
          confirmVariant="bd"
          onConfirm={confirmDelete}
          onCancel={() => setDelTask(null)}
        />
      )}
    </div>
  );
}
