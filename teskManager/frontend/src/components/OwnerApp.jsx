import { useState } from "react";
import { Sidebar } from "./Sidebar.jsx";
import { TaskList } from "./TaskList.jsx";
import { TaskModal } from "./TaskModal.jsx";
import { UserModal } from "./UserModal.jsx";
import { Board } from "./Board.jsx";
import { SprintsPage } from "./SprintsPage.jsx";
import { BacklogPage } from "./BacklogPage.jsx";
import { RoadmapPage } from "./RoadmapPage.jsx";
import { WorkflowEditor } from "./WorkflowEditor.jsx";
import { ConfirmDialog } from "./Modal.jsx";
import { DAY_LABELS, STATUS_CONFIG } from "../lib/constants.js";
import { today, addDays, getWeekDates } from "../lib/dates.js";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⬡" },
  { id: "board",     label: "Board",     icon: "▥" },
  { id: "backlog",   label: "Backlog",   icon: "≡" },
  { id: "sprints",   label: "Sprints",   icon: "⚡" },
  { id: "roadmap",   label: "Roadmap",   icon: "↦" },
  { id: "tasks",     label: "Tasks",     icon: "✦" },
  { id: "team",      label: "Team",      icon: "⊕" },
  { id: "settings",  label: "Settings",  icon: "⚙" },
];

export function OwnerApp({ me, users, tasks, perms, transitions, sprints = [], actions, onLogout, onError }) {
  const [page, setPage] = useState("dashboard");
  const [view, setView] = useState("day");
  const [taskMod, setTaskMod] = useState(null);   // {task?: Task} | null
  const [userMod, setUserMod] = useState(null);   // {user?: User, isSelf?: bool} | null
  const [delUser, setDelUser] = useState(null);
  const [delTask, setDelTask] = useState(null);
  const [search, setSearch] = useState("");
  const [weekBase, setWeekBase] = useState(new Date());
  const [selDay, setSelDay] = useState(today());
  const [filterEmp, setFilterEmp] = useState("all");
  const [sbOpen, setSbOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Everyone except the owner can be assigned tasks (employees and admins both).
  const emps = users.filter((u) => u.role !== "owner");

  const handleSaveTask = async (data) => {
    setBusy(true);
    try {
      if (taskMod?.task) await actions.updateTask(taskMod.task.id, data);
      else await actions.createTask(data);
      setTaskMod(null);
    } catch {} finally { setBusy(false); }
  };

  const handleSaveUser = async (data) => {
    setBusy(true);
    try {
      if (userMod?.user) await actions.updateUser(userMod.user.id, data, !!userMod.isSelf);
      else await actions.createUser(data);
      setUserMod(null);
    } catch {} finally { setBusy(false); }
  };

  const weekDates = getWeekDates(weekBase);
  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) &&
    (filterEmp === "all" || t.assigneeId === filterEmp)
  );

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "complete").length;
  const bugs = tasks.filter((t) => t.issueType === "bug").length;
  const inp  = tasks.filter((t) => t.status === "in-progress").length;

  return (
    <div className="shell">
      <div className="topbar">
        <div className="topbar-logo">TASKFLOW</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="av" style={{ background: me.color || "#6c8ef5", width: 28, height: 28, fontSize: 11 }}>{me.name[0]}</div>
          <button className="hbg" onClick={() => setSbOpen(true)}><span /><span /><span /></button>
        </div>
      </div>

      <Sidebar me={me} page={page} setPage={setPage} navItems={NAV} onLogout={onLogout} open={sbOpen} setOpen={setSbOpen} />

      <div className="main">
        {page === "dashboard" && (
          <>
            <div className="ph">
              <div className="pt">Dashboard</div>
              <div className="ps">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
            </div>
            <div className="sg">
              {[
                { l: "Total",       v: total, s: "all tasks",                                    ac: "#6c8ef5" },
                { l: "In Progress", v: inp,   s: "active",                                       ac: "#f59e0b" },
                { l: "Completed",   v: done,  s: `${total ? Math.round(done / total * 100) : 0}% done`, ac: "#10b981" },
                { l: "Bugs",        v: bugs,  s: "needs fix",                                    ac: "#ef4444" },
              ].map((s) => (
                <div className="sc" key={s.l} style={{ "--ac": s.ac }}>
                  <div className="sl">{s.l}</div>
                  <div className="sv">{s.v}</div>
                  <div className="ss">{s.s}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="ct">
                Today's Tasks
                <button className="bn" onClick={() => setTaskMod({})}>＋ New Task</button>
              </div>
              <TaskList
                tasks={tasks.filter((t) => t.date === today())}
                emps={emps}
                onEdit={(t) => setTaskMod({ task: t })}
                onDel={(id) => setDelTask(id)}
                onExt={(id) => actions.extendTask(id).catch(() => {})}
                onOpenRemarks={(t) => setTaskMod({ task: t, tab: "remarks" })}
                onUpdateStatus={(id, status) => actions.updateTask(id, { status }).catch(() => {})}
                sprints={sprints}
                isOwner
              />
            </div>
          </>
        )}

        {page === "sprints" && (
          <SprintsPage onError={onError} />
        )}

        {page === "backlog" && (
          <BacklogPage
            tasks={tasks}
            emps={emps}
            actions={actions}
            onCardClick={(t) => setTaskMod({ task: t })}
            onError={onError}
          />
        )}

        {page === "roadmap" && (
          <RoadmapPage
            tasks={tasks}
            emps={emps}
            onCardClick={(t) => setTaskMod({ task: t })}
          />
        )}

        {page === "board" && (
          <>
            <div className="ph">
              <div className="pt">Board</div>
              <div className="ps">Drag cards across columns to update status</div>
            </div>
            <Board
              tasks={tasks}
              emps={emps}
              onCardClick={(t) => setTaskMod({ task: t })}
              onMoveStatus={(id, status) => actions.updateTask(id, { status })}
              onError={onError}
            />
          </>
        )}

        {page === "tasks" && (
          <>
            <div className="ph"><div className="pt">Task Manager</div><div className="ps">Create, assign and track all tasks</div></div>
            <div className="tb">
              <div className="tbl">
                <div className="sx">
                  <span style={{ color: "var(--text3)", fontSize: 14 }}>⌕</span>
                  <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="fse" style={{ width: "auto", padding: "7px 11px" }} value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)}>
                  <option value="all">All Members</option>
                  {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="vt">
                <button className={`vb ${view === "day" ? "a" : ""}`} onClick={() => setView("day")}>Day</button>
                <button className={`vb ${view === "week" ? "a" : ""}`} onClick={() => setView("week")}>Week</button>
              </div>
              <button className="bn" onClick={() => setTaskMod({})}>＋ New</button>
            </div>

            {view === "week" && (
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
                    const isT = date === today();
                    const dayT = filtered.filter((t) => t.date === date);
                    return (
                      <div key={date} className={`dc ${isT ? "tod" : ""}`}>
                        <div className="dh">
                          <div className="dname">{DAY_LABELS[i]}</div>
                          <div className="dn">{new Date(date + "T00:00:00").getDate()}</div>
                        </div>
                        <div className="dts">
                          {dayT.map((t) => {
                            const sc = STATUS_CONFIG[t.status];
                            const e = emps.find((x) => x.id === t.assigneeId);
                            return (
                              <div
                                key={t.id}
                                className="mt"
                                style={{ borderColor: sc.color, background: sc.bg }}
                                onClick={() => { setSelDay(date); setView("day"); }}
                              >
                                {t.title}
                                {e && <div className="ma">→ {e.name}</div>}
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
            )}

            {view === "day" && (
              <>
                <div className="dn2">
                  <button className="dnb" onClick={() => setSelDay(addDays(selDay, -1))}>‹</button>
                  <div className="dtit">
                    {new Date(selDay + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    {selDay === today() && <span className="tb2">TODAY</span>}
                  </div>
                  <button className="dnb" onClick={() => setSelDay(addDays(selDay, 1))}>›</button>
                </div>
                <TaskList
                  tasks={filtered.filter((t) => t.date === selDay)}
                  emps={emps}
                  onEdit={(t) => setTaskMod({ task: t })}
                  onDel={(id) => setDelTask(id)}
                  onExt={(id) => actions.extendTask(id).catch(() => {})}
                  onOpenRemarks={(t) => setTaskMod({ task: t, tab: "remarks" })}
                  onUpdateStatus={(id, status) => actions.updateTask(id, { status }).catch(() => {})}
                  isOwner
                />
              </>
            )}
          </>
        )}

        {page === "team" && (
          <>
            <div className="ph"><div className="pt">Team Management</div><div className="ps">Add, edit and manage your team</div></div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="ct">
                <span>Team ({emps.length})</span>
                <button className="bn" onClick={() => setUserMod({})}>＋ Add User</button>
              </div>
              {!emps.length ? (
                <div className="em"><div className="ei">👥</div><div className="et2">No team members yet. Add one!</div></div>
              ) : (
                <div className="ug">
                  {emps.map((emp) => {
                    const et = tasks.filter((t) => t.assigneeId === emp.id);
                    const isAdmin = emp.role === "admin";
                    const canEditTarget = me.role === "owner" || (me.role === "admin" && emp.role === "employee");
                    return (
                      <div className="uc" key={emp.id}>
                        <div className="av" style={{ background: emp.color || "#6c8ef5", width: 44, height: 44, fontSize: 17 }}>{emp.name[0]}</div>
                        <div className="uci">
                          <div className="ucn">{emp.name}</div>
                          <div className="uce">{emp.email}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                            <span className="bg" style={{
                              background: isAdmin ? "rgba(167,139,250,.15)" : "rgba(108,142,245,.15)",
                              color: isAdmin ? "var(--purple)" : "var(--accent)",
                            }}>{isAdmin ? "Admin" : "Employee"}</span>
                            <span style={{ fontSize: 10, color: "var(--text3)" }}>{et.length} tasks</span>
                          </div>
                        </div>
                        <div className="uca">
                          {canEditTarget && (
                            <button className="ib" title="Edit" onClick={() => setUserMod({ user: emp })}>✎</button>
                          )}
                          {canEditTarget && (
                            <button className="ib d" title="Delete" onClick={() => setDelUser(emp)}>✕</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="card">
              <div className="ct">Performance Overview</div>
              <div style={{ overflowX: "auto" }}>
                <table className="et">
                  <thead><tr><th>Member</th><th>Tasks</th><th>Done</th><th>In Progress</th><th>Bugs</th></tr></thead>
                  <tbody>
                    {emps.map((emp) => {
                      const et = tasks.filter((t) => t.assigneeId === emp.id);
                      return (
                        <tr key={emp.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div className="av" style={{ background: emp.color || "#6c8ef5", width: 24, height: 24, fontSize: 10 }}>{emp.name[0]}</div>{emp.name}
                            </div>
                          </td>
                          <td style={{ fontFamily: "var(--mono)" }}>{et.length}</td>
                          <td style={{ color: "#10b981", fontFamily: "var(--mono)" }}>{et.filter((t) => t.status === "complete").length}</td>
                          <td style={{ color: "#f59e0b", fontFamily: "var(--mono)" }}>{et.filter((t) => t.status === "in-progress").length}</td>
                          <td style={{ color: "#ef4444", fontFamily: "var(--mono)" }}>{et.filter((t) => t.issueType === "bug").length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {page === "settings" && (
          <>
            <div className="ph"><div className="pt">Settings</div><div className="ps">Permissions and profile</div></div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="ct">Employee Permissions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { key: "dayView",             l: "Day View",            s: "Allow employees to see their daily task list" },
                  { key: "weekView",            l: "Week View",           s: "Allow employees to browse the weekly calendar" },
                  { key: "empCanCreateTask",    l: "Create Tasks",        s: "Allow employees to create new tasks (assigned to themselves)" },
                  { key: "empCanEditOwnTask",   l: "Edit Own Tasks",      s: "Allow employees to edit fields like title, description, priority on their own tasks" },
                  { key: "empCanExtendOwnTask", l: "Extend Own Due Date", s: "Allow employees to push the due date of their own tasks" },
                  { key: "empCanDeleteOwnTask", l: "Delete Own Tasks",    s: "Allow employees to delete their own tasks" },
                ].map((p) => (
                  <div className="trow" key={p.key}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text0)" }}>{p.l}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{p.s}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text2)" }}>{perms[p.key] ? "On" : "Off"}</span>
                      <button
                        className={`tgl ${perms[p.key] ? "on" : "off"}`}
                        onClick={() => actions.savePerms({ ...perms, [p.key]: !perms[p.key] }).catch(() => {})}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <WorkflowEditor
                perms={perms}
                onSavePerms={(next) => actions.savePerms(next).catch(() => {})}
                onError={onError}
              />
            </div>
            <div className="card">
              <div className="ct">My Profile</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div className="av" style={{ background: me.color || "#6c8ef5", width: 56, height: 56, fontSize: 22 }}>{me.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{me.name}</div>
                  <div style={{ color: "var(--text2)", fontSize: 13, fontFamily: "var(--mono)" }}>{me.email}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>Owner</div>
                </div>
                <button className="bg2" style={{ marginLeft: "auto" }} onClick={() => setUserMod({ user: me, isSelf: true })}>Edit Profile</button>
              </div>
            </div>
          </>
        )}
      </div>

      {taskMod !== null && (
        <TaskModal
          task={taskMod.task}
          emps={emps}
          currentUser={me}
          transitions={transitions}
          enforceWorkflow={!!perms.enforceWorkflow}
          defaultTab={taskMod.tab || "details"}
          onSave={handleSaveTask}
          onClose={() => setTaskMod(null)}
          onError={onError}
          busy={busy}
        />
      )}

      {userMod !== null && (
        <UserModal
          user={userMod.user}
          isSelf={userMod.isSelf}
          currentUserRole={me.role}
          onSave={handleSaveUser}
          onClose={() => setUserMod(null)}
          busy={busy}
        />
      )}

      {delUser && (
        <ConfirmDialog
          icon="🗑️"
          title={`Delete ${delUser.name}?`}
          message="All tasks assigned to them will also be deleted. This cannot be undone."
          confirmLabel="Delete"
          confirmVariant="bd"
          onConfirm={() => actions.deleteUser(delUser.id).catch(() => {}).finally(() => setDelUser(null))}
          onCancel={() => setDelUser(null)}
        />
      )}

      {delTask && (
        <ConfirmDialog
          icon="🗑️"
          title="Delete this task?"
          message="This will permanently remove the task and its remarks."
          confirmLabel="Delete"
          confirmVariant="bd"
          onConfirm={() => actions.deleteTask(delTask).catch(() => {}).finally(() => setDelTask(null))}
          onCancel={() => setDelTask(null)}
        />
      )}
    </div>
  );
}

