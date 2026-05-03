import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { fmtRelative } from "../lib/dates.js";

export function RemarkThread({ taskId, currentUser, onError }) {
  const [remarks, setRemarks] = useState([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.remarks.list(taskId)
      .then((r) => { if (!cancelled) setRemarks(r); })
      .catch((e) => onError?.(e.message))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [taskId, onError]);

  const add = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    try {
      const created = await api.remarks.add(taskId, text);
      setRemarks((p) => [...p, created]);
      setBody("");
    } catch (e) {
      onError?.(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.remarks.remove(taskId, id);
      setRemarks((p) => p.filter((r) => r.id !== id));
    } catch (e) {
      onError?.(e.message);
    }
  };

  const canDelete = (r) =>
    currentUser.role === "owner" || currentUser.role === "admin" || r.authorId === currentUser.id;

  return (
    <div className="rmk">
      <div className="rmk-h">
        <span>Remarks {remarks.length > 0 && `(${remarks.length})`}</span>
      </div>

      <div className="rmk-list">
        {loading
          ? <div className="rmk-empty">Loading…</div>
          : remarks.length === 0
            ? <div className="rmk-empty">No remarks yet — add one below.</div>
            : remarks.map((r) => (
                <div key={r.id} className="rmk-it">
                  <div className="rmk-av" style={{ background: r.authorColor || "#6c8ef5" }}>
                    {r.authorName?.[0]?.toUpperCase()}
                  </div>
                  <div className="rmk-bd">
                    <div className="rmk-mt">
                      <span className="rmk-au">{r.authorName}</span>
                      <span>· {fmtRelative(r.createdAt)}</span>
                      {canDelete(r) && (
                        <button className="rmk-del" onClick={() => remove(r.id)} title="Delete">✕</button>
                      )}
                    </div>
                    <div className="rmk-tx">{r.body}</div>
                  </div>
                </div>
              ))
        }
      </div>

      <div className="rmk-add">
        <textarea
          placeholder="Write an optional remark…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) add(); }}
        />
        <button onClick={add} disabled={busy || !body.trim()}>
          {busy ? "…" : "Post"}
        </button>
      </div>
    </div>
  );
}
