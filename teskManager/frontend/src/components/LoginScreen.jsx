import { useState } from "react";
import { api, setToken } from "../lib/api.js";

export function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setErr(""); setName(""); setEmail(""); setPass(""); setPass2(""); };
  const switchMode = (m) => { reset(); setMode(m); };

  const submit = async () => {
    setErr("");
    if (!email.trim() || !pass.trim()) {
      setErr("Email and password are required."); return;
    }
    if (mode === "signup") {
      if (!name.trim()) { setErr("Name is required."); return; }
      if (pass.length < 4) { setErr("Password must be at least 4 characters."); return; }
      if (pass !== pass2) { setErr("Passwords don't match."); return; }
    }
    setBusy(true);
    try {
      const { token, user } =
        mode === "signin"
          ? await api.auth.login(email.trim(), pass)
          : await api.auth.register({ name: name.trim(), email: email.trim(), password: pass });
      setToken(token);
      onLogin(user);
    } catch (e) {
      setErr(e.message || (mode === "signin" ? "Login failed" : "Signup failed"));
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => e.key === "Enter" && !busy && submit();

  return (
    <div className="lw">
      <div className="lc">
        <div className="ll">TaskFlow OS</div>
        <div className="lt">{mode === "signin" ? "Welcome back" : "Create your account"}</div>
        <div className="ls">
          {mode === "signin"
            ? "Sign in to your workspace"
            : "Sign up — your owner can promote you to admin later"}
        </div>

        <div className="tabs">
          <button className={`tbb ${mode === "signin" ? "a" : ""}`} onClick={() => switchMode("signin")}>Sign In</button>
          <button className={`tbb ${mode === "signup" ? "a" : ""}`} onClick={() => switchMode("signup")}>Sign Up</button>
        </div>

        {mode === "signup" && (
          <div className="fd">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={onKey}
              autoFocus
            />
          </div>
        )}

        <div className="fd">
          <label>Email</label>
          <input
            type="text"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            autoFocus={mode === "signin"}
          />
        </div>

        <div className="fd">
          <label>Password</label>
          <input
            type="password"
            placeholder={mode === "signup" ? "Min 4 characters" : "••••••••"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={onKey}
          />
        </div>

        {mode === "signup" && (
          <div className="fd">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
              onKeyDown={onKey}
            />
          </div>
        )}

        <button className="bp" onClick={submit} disabled={busy}>
          {busy
            ? (mode === "signin" ? "Signing in…" : "Creating account…")
            : (mode === "signin" ? "Sign In →" : "Create Account →")}
        </button>
        {err && <div className="er">{err}</div>}
      </div>
    </div>
  );
}
