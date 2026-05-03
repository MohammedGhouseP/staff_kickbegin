import { useEffect, useState } from "react";
import { STATUS_CONFIG } from "../lib/constants.js";
import { api } from "../lib/api.js";

const STATUSES = Object.keys(STATUS_CONFIG); // 3 entries today

const keyOf = (from, to) => `${from}>${to}`;

export function WorkflowEditor({ perms, onSavePerms, onError }) {
  const [matrix, setMatrix] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.transitions.list()
      .then((rows) => {
        const set = new Set();
        for (const r of rows) set.add(keyOf(r.from || r.fromStatus, r.to || r.toStatus));
        setMatrix(set);
        setLoading(false);
      })
      .catch((err) => { onError?.(err); setLoading(false); });
  }, [onError]);

  const toggle = (from, to) => {
    setMatrix((prev) => {
      const next = new Set(prev);
      const k = keyOf(from, to);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
    setDirty(true);
  };

  const preset = (kind) => {
    const next = new Set();
    if (kind === "linear") {
      // Strict pipeline: yet → in-progress → complete
      next.add(keyOf("yet-to-start", "in-progress"));
      next.add(keyOf("in-progress", "complete"));
    } else if (kind === "flexible") {
      // Forward + back: yet ↔ in-progress, in-progress → complete, complete → in-progress
      next.add(keyOf("yet-to-start", "in-progress"));
      next.add(keyOf("in-progress", "yet-to-start"));
      next.add(keyOf("in-progress", "complete"));
      next.add(keyOf("complete", "in-progress"));
    } else if (kind === "open") {
      // Anything to anything (excludes self).
      for (const f of STATUSES) for (const t of STATUSES) if (f !== t) next.add(keyOf(f, t));
    }
    setMatrix(next);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const transitions = [...matrix].map((k) => {
        const [from, to] = k.split(">");
        return { from, to };
      });
      await api.transitions.replace(transitions);
      setDirty(false);
    } catch (err) { onError?.(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="card">
      <div className="ct">Workflow Rules</div>

      <div className="trow" style={{ marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text0)" }}>Enforce workflow rules</div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
            When on, status changes must match an allowed transition below. When off, any status change is permitted.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text2)" }}>{perms.enforceWorkflow ? "On" : "Off"}</span>
          <button
            className={`tgl ${perms.enforceWorkflow ? "on" : "off"}`}
            onClick={() => onSavePerms({ ...perms, enforceWorkflow: !perms.enforceWorkflow })}
          />
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8 }}>
        Allowed Transitions
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <button className="bg2" onClick={() => preset("linear")}>Linear pipeline</button>
        <button className="bg2" onClick={() => preset("flexible")}>Flexible (back-and-forth)</button>
        <button className="bg2" onClick={() => preset("open")}>Allow all</button>
        <button className="bg2" onClick={() => { setMatrix(new Set()); setDirty(true); }}>Clear</button>
      </div>

      {loading ? (
        <div style={{ color: "var(--text2)", fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="wfm">
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>From ↓ / To →</th>
                {STATUSES.map((s) => (
                  <th key={s} style={{ padding: 8 }}>
                    <span style={{ color: STATUS_CONFIG[s].color }}>{STATUS_CONFIG[s].icon}</span>{" "}
                    {STATUS_CONFIG[s].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STATUSES.map((from) => (
                <tr key={from}>
                  <td style={{ padding: 8, fontWeight: 600, color: "var(--text1)" }}>
                    <span style={{ color: STATUS_CONFIG[from].color }}>{STATUS_CONFIG[from].icon}</span>{" "}
                    {STATUS_CONFIG[from].label}
                  </td>
                  {STATUSES.map((to) => (
                    <td key={to} style={{ padding: 8, textAlign: "center" }}>
                      {from === to ? (
                        <span style={{ color: "var(--text3)" }}>—</span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={matrix.has(keyOf(from, to))}
                          onChange={() => toggle(from, to)}
                          style={{ cursor: "pointer", width: 16, height: 16 }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mf" style={{ marginTop: 14 }}>
        <button className="bs" disabled={!dirty || saving} onClick={save}>
          {saving ? "Saving…" : "Save Transitions"}
        </button>
      </div>
    </div>
  );
}
