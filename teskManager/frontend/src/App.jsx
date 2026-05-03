import { useCallback, useEffect, useState } from "react";

import { css } from "./styles.js";
import { api, getToken, setToken } from "./lib/api.js";
import { addDays } from "./lib/dates.js";
import { playSound } from "./lib/sound.js";

import { LoginScreen } from "./components/LoginScreen.jsx";
import { OwnerApp } from "./components/OwnerApp.jsx";
import { EmployeeApp } from "./components/EmployeeApp.jsx";
import { TaskAssignedNotification } from "./components/Notification.jsx";
import { ConfirmDialog } from "./components/Modal.jsx";
import { Toast } from "./components/Toast.jsx";

export default function App() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [perms, setPerms] = useState({ dayView: true, weekView: true, enforceWorkflow: false });
  const [transitions, setTransitions] = useState([]);
  const [sprints, setSprints] = useState([]);

  const [bootstrap, setBootstrap] = useState({ loading: !!getToken(), error: null });
  const [notif, setNotif] = useState(null);
  const [toast, setToast] = useState(null);
  const [logoutDlg, setLogoutDlg] = useState(false);

  const showError = useCallback((message) => setToast({ message, kind: "err" }), []);
  const showInfo = useCallback((message) => setToast({ message, kind: "ok" }), []);

  // Load all data the current user is allowed to see.
  const loadAll = useCallback(async (user) => {
    const isStaff = user.role === "owner" || user.role === "admin";
    const requests = [api.tasks.list(), api.settings.get(), api.transitions.list(), api.sprints.list()];
    if (isStaff) requests.push(api.users.list());
    const [t, s, tr, sp, u] = await Promise.all(requests);
    setTasks(t);
    setPerms(s);
    setTransitions(tr);
    setSprints(sp);
    setUsers(isStaff ? u : [user]);
  }, []);

  // Bootstrap on mount: if we have a token, fetch /me and the rest.
  useEffect(() => {
    if (!getToken()) return;
    api.auth.me()
      .then(({ user }) => {
        setMe(user);
        return loadAll(user);
      })
      .catch(() => setToken(null))
      .finally(() => setBootstrap({ loading: false, error: null }));
  }, [loadAll]);

  const onLogin = async (user) => {
    setMe(user);
    setBootstrap({ loading: true, error: null });
    try {
      await loadAll(user);
    } catch (e) {
      showError(e.message);
    } finally {
      setBootstrap({ loading: false, error: null });
    }
  };

  const doLogout = () => {
    setToken(null);
    setMe(null);
    setUsers([]);
    setTasks([]);
    setLogoutDlg(false);
  };

  const baseActions = {
    createTask: async (data) => {
      const t = await api.tasks.create(data);
      setTasks((p) => [t, ...p]);
      // Only show the "task assigned" toast when assigning to someone else.
      if (data.assigneeId !== me?.id) {
        const a = users.find((u) => u.id === data.assigneeId);
        if (a) { setNotif({ task: t, assignee: a }); playSound(); }
      }
      return t;
    },
    updateTask: async (id, data) => {
      const t = await api.tasks.update(id, data);
      setTasks((p) => p.map((x) => (x.id === id ? t : x)));
      return t;
    },
    deleteTask: async (id) => {
      await api.tasks.remove(id);
      setTasks((p) => p.filter((t) => t.id !== id));
    },
    extendTask: async (id) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) {
        showError(`Cannot extend: task not found (id ${id})`);
        return;
      }
      if (!task.dueDate) {
        showError("Cannot extend: this task has no due date");
        return;
      }
      const newDue = addDays(task.dueDate, 1);
      const updated = await api.tasks.update(id, { dueDate: newDue, extended: true });
      setTasks((p) => p.map((x) => (x.id === id ? updated : x)));
      showInfo(`${updated.issueKey || "Task"} extended → ${updated.dueDate}`);
      return updated;
    },
    createUser: async (data) => {
      const u = await api.users.create(data);
      setUsers((p) => [...p, u]);
      return u;
    },
    updateUser: async (id, data, isSelf) => {
      const u = await api.users.update(id, data);
      setUsers((p) => p.map((x) => (x.id === id ? u : x)));
      if (isSelf) setMe(u);
      return u;
    },
    deleteUser: async (id) => {
      await api.users.remove(id);
      setUsers((p) => p.filter((u) => u.id !== id));
      setTasks((p) => p.filter((t) => t.assigneeId !== id));
    },
    savePerms: async (next) => {
      const saved = await api.settings.save(next);
      setPerms(saved);
    },
    reloadTransitions: async () => {
      const tr = await api.transitions.list();
      setTransitions(tr);
      return tr;
    },
  };

  // DRY: wrap every action so any thrown error becomes a toast.
  const actions = Object.fromEntries(
    Object.entries(baseActions).map(([k, fn]) => [
      k,
      async (...args) => {
        try { return await fn(...args); }
        catch (e) { showError(e.message); throw e; }
      },
    ])
  );

  return (
    <>
      <style>{css}</style>

      <TaskAssignedNotification notif={notif} onClose={() => setNotif(null)} />
      <Toast toast={toast} onClose={() => setToast(null)} />

      {logoutDlg && (
        <ConfirmDialog
          icon="👋"
          title="Sign out?"
          message="You'll need to sign in again to access your workspace."
          confirmLabel="Yes, sign out"
          confirmVariant="bd"
          onConfirm={doLogout}
          onCancel={() => setLogoutDlg(false)}
        />
      )}

      {!me ? (
        <LoginScreen onLogin={onLogin} />
      ) : bootstrap.loading ? (
        <div className="loader"><div className="spinner" /><div>Loading your workspace…</div></div>
      ) : (me.role === "owner" || me.role === "admin") ? (
        <OwnerApp
          me={me}
          users={users}
          tasks={tasks}
          perms={perms}
          transitions={transitions}
          sprints={sprints}
          actions={actions}
          onLogout={() => setLogoutDlg(true)}
          onError={showError}
        />
      ) : (
        <EmployeeApp
          me={me}
          tasks={tasks}
          perms={perms}
          transitions={transitions}
          sprints={sprints}
          actions={actions}
          onLogout={() => setLogoutDlg(true)}
          onError={showError}
        />
      )}
    </>
  );
}
