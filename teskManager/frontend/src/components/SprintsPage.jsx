import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { today, addDays } from "../lib/dates.js";
import { ConfirmDialog } from "./Modal.jsx";

const STATUS_META = {
  planned:   { label: "Planned",   color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
  active:    { label: "Active",    color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  completed: { label: "Completed", color: "#8892b0", bg: "rgba(136,146,176,0.15)" },
};

export function SprintsPage({ onError }) {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [del, setDel] = useState(null);

  const load = () =>
    api.sprints.list()
      .then((rows) => { setSprints(rows); setLoading(false); })
      .catch((err) => { onError?.(err); setLoading(false); });

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onSave = async (data) => {
    try {
      if (editing) await api.sprints.update(editing.id, data);
      else await api.sprints.create(data);
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) { onError?.(err); }
  };

  const setStatus = async (sprint, status) => {
    try {
      await api.sprints.update(sprint.id, { status });
      load();
    } catch (err) { onError?.(err); }
  };

  const remove = async () => {
    if (!del) return;
    try {
      await api.sprints.remove(del.id);
      setDel(null);
      load();
    } catch (err) { onError?.(err); setDel(null); }
  };

  return (
    <>
      <div className="ph">
        <div className="pt">Sprints</div>
        <div className="ps">Plan and run time-boxed iterations</div>
      </div>

      <div className="tb">
        <div className="tbl"><span style={{ color: "var(--text2)", fontSize: 13 }}>{sprints.length} sprint{sprints.length === 1 ? "" : "s"}</span></div>
        <button className="bn" onClick={() => { setEditing(null); setShowForm(true); }}>＋ New Sprint</button>
      </div>

      {showForm && (
        <SprintForm
          initial={editing}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSave={onSave}
        />
      )}

      {loading ? (
        <div className="em"><div className="et2">Loading…</div></div>
      ) : sprints.length === 0 ? (
        <div className="em"><div className="ei">⚡</div><div className="et2">No sprints yet. Create one to start planning.</div></div>
      ) : (
        <div className="spl">
          {sprints.map((s) => {
            const m = STATUS_META[s.status];
            const total = s.taskCount || 0;
            const done = s.completedCount || 0;
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div key={s.id} className="spc">
                <div className="spch">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span className="spn">{s.name}</span>
                    <span className="bg" style={{ background: m.bg, color: m.color }}>{m.label}</span>
                  </div>
                  <div className="spa">
                    {s.status === "planned" && (
                      <button className="bs" onClick={() => setStatus(s, "active")}>▶ Start</button>
                    )}
                    {s.status === "active" && (
                      <button className="bs" onClick={() => setStatus(s, "completed")}>✓ Complete</button>
                    )}
                    <button className="ib" title="Edit" onClick={() => { setEditing(s); setShowForm(true); }}>✎</button>
                    <button className="ib d" title="Delete" onClick={() => setDel(s)}>✕</button>
                  </div>
                </div>
                {s.goal && <div className="spg">{s.goal}</div>}
                <div className="spm">
                  <span>📅 {s.startDate} → {s.endDate}</span>
                  <span>·</span>
                  <span>📋 {done}/{total} done</span>
                </div>
                <div className="spbar"><div className="spbarf" style={{ width: pct + "%", background: m.color }} /></div>
              </div>
            );
          })}
        </div>
      )}

      {del && (
        <ConfirmDialog
          icon="🗑"
          title="Delete sprint?"
          message={`Sprint "${del.name}" will be deleted. Tasks in this sprint will return to the backlog.`}
          confirmLabel="Delete sprint"
          confirmVariant="bd"
          onConfirm={remove}
          onCancel={() => setDel(null)}
        />
      )}
    </>
  );
}

function SprintForm({ initial, onCancel, onSave }) {
  const [f, setF] = useState({
    name:      initial?.name      || "",
    goal:      initial?.goal      || "",
    startDate: initial?.startDate || today(),
    endDate:   initial?.endDate   || addDays(today(), 14),
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name.trim()) return;
    setBusy(true);
    try { await onSave(f); }
    finally { setBusy(false); }
  };

  return (
    <div className="spform">
      <div className="ff">
        <label>Sprint Name *</label>
        <input className="fi2" placeholder="e.g. Sprint 1 — Onboarding revamp" value={f.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="ff">
        <label>Goal</label>
        <textarea className="fta" placeholder="What's the goal of this sprint?" value={f.goal} onChange={(e) => set("goal", e.target.value)} />
      </div>
      <div className="fr">
        <div className="ff"><label>Start Date *</label>
          <input className="fi2" type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div className="ff"><label>End Date *</label>
          <input className="fi2" type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </div>
      </div>
      <div className="mf">
        <button className="bg2" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="bs" onClick={submit} disabled={busy || !f.name.trim()}>
          {busy ? "Saving…" : initial ? "Save Changes" : "Create Sprint"}
        </button>
      </div>
    </div>
  );
}
