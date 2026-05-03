import { useState } from "react";
import { Modal } from "./Modal.jsx";
import { AVATAR_COLORS } from "../lib/constants.js";

export function UserModal({ user, isSelf, currentUserRole, onSave, onClose, busy }) {
  const [f, setF] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    color: user?.color || AVATAR_COLORS[0],
    role: user?.role || "employee",
  });
  const [showPw, setShowPw] = useState(false);
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));

  // Role select shows only when the actor is the owner AND the target isn't the owner.
  const canPickRole = currentUserRole === "owner" && user?.role !== "owner" && !isSelf;

  const submit = () => {
    if (!f.name.trim() || !f.email.trim()) return;
    if (!user && !f.password.trim()) return; // password required for new users
    const payload = { name: f.name.trim(), email: f.email.trim(), color: f.color };
    if (f.password.trim()) payload.password = f.password.trim();
    if (canPickRole) payload.role = f.role;
    onSave(payload);
  };

  return (
    <Modal title={user ? "Edit Profile" : "Add Team Member"} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px", background: "var(--bg2)", borderRadius: 10 }}>
        <div className="av" style={{ background: f.color, width: 50, height: 50, fontSize: 20 }}>
          {f.name[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text0)" }}>{f.name || "New Employee"}</div>
          <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "var(--mono)" }}>{f.email || "username"}</div>
        </div>
      </div>

      <div className="ff">
        <label>Full Name *</label>
        <input className="fi2" placeholder="e.g. Alex Turner" value={f.name} onChange={(e) => s("name", e.target.value)} />
      </div>

      <div className="fr">
        <div className="ff">
          <label>{isSelf ? "Email" : "Username"} *</label>
          <input className="fi2" placeholder={isSelf ? "email@company.com" : "e.g. alex"}
            value={f.email} onChange={(e) => s("email", e.target.value)} />
        </div>
        <div className="ff">
          <label>{user ? "New Password (optional)" : "Password *"}</label>
          <div style={{ position: "relative" }}>
            <input
              className="fi2"
              type={showPw ? "text" : "password"}
              placeholder={user ? "Leave blank to keep" : "Set password"}
              value={f.password}
              onChange={(e) => s("password", e.target.value)}
              style={{ paddingRight: 36 }}
            />
            <button
              onClick={() => setShowPw((v) => !v)}
              style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 13, padding: 0 }}
              type="button"
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
      </div>

      {canPickRole && (
        <div className="ff">
          <label>Role</label>
          <select className="fse" value={f.role} onChange={(e) => s("role", e.target.value)}>
            <option value="employee">Employee — limited actions, only sees own tasks</option>
            <option value="admin">Admin — full task/sprint/team access (cannot demote other admins)</option>
          </select>
        </div>
      )}

      <div className="ff">
        <label>Avatar Color</label>
        <div className="cp">
          {AVATAR_COLORS.map((c) => (
            <div
              key={c}
              className={`cd ${f.color === c ? "sel" : ""}`}
              style={{ background: c }}
              onClick={() => s("color", c)}
            />
          ))}
        </div>
      </div>

      <div className="mf">
        <button className="bg2" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="bs" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : user ? "Save Changes" : "Create User"}
        </button>
      </div>
    </Modal>
  );
}
