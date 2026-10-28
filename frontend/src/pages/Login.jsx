import { useState } from "react";
import * as api from "../api";
import { useAuth } from "../auth";
import { Alert, Brand, ErrorBox, Tabs } from "../components/ui";

function maxDob() {
  const t = new Date();
  const d = new Date(t.getFullYear() - 18, t.getMonth(), Math.min(t.getDate(), 28));
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function LoginForm({ onSession }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [localError, setLocalError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setLocalError("");
    if (!email || !password) { setLocalError("Enter your email and password."); return; }
    setBusy(true);
    try { onSession(await api.login(email, password)); } catch (err) { setError(err); setBusy(false); }
  };

  return (
    <form onSubmit={submit}>
      <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></div>
      <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
      <Alert kind="error">{localError}</Alert>
      <ErrorBox error={error} />
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
    </form>
  );
}

function RegisterForm({ onSession }) {
  const [f, setF] = useState({ name: "", email: "", pw: "", pw2: "", dob: "", gender: "", city: "" });
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const p = [];
    if (f.name.trim().length < 2) p.push("Enter your full name.");
    if (!f.email) p.push("Enter your email.");
    if (!f.dob) p.push("Select your date of birth.");
    if (!f.gender) p.push("Select your gender.");
    if (!f.city.trim()) p.push("Enter your city.");
    if (f.pw !== f.pw2) p.push("Passwords do not match.");
    setProblems(p);
    if (p.length) return;
    setBusy(true);
    try {
      onSession(await api.register({
        name: f.name.trim(), email: f.email, password: f.pw, confirm_password: f.pw2,
        date_of_birth: f.dob, gender: f.gender, city: f.city.trim(),
      }));
    } catch (err) { setError(err); setBusy(false); }
  };

  return (
    <form onSubmit={submit}>
      <div className="field"><label>Full name</label><input type="text" value={f.name} onChange={set("name")} /></div>
      <div className="field"><label>Email</label><input type="email" value={f.email} onChange={set("email")} /></div>
      <div className="form-row">
        <div className="field"><label>Password</label><input type="password" value={f.pw} onChange={set("pw")} autoComplete="new-password" />
          <span className="hint">8+ characters with upper, lower case and a digit</span></div>
        <div className="field"><label>Confirm password</label><input type="password" value={f.pw2} onChange={set("pw2")} autoComplete="new-password" /></div>
      </div>
      <div className="form-row">
        <div className="field"><label>Date of birth (18+)</label><input type="date" value={f.dob} onChange={set("dob")} min="1920-01-01" max={maxDob()} /></div>
        <div className="field"><label>Gender</label>
          <select value={f.gender} onChange={set("gender")}>
            <option value="">Select</option>
            {["Male", "Female", "Other", "Prefer not to say"].map((g) => <option key={g} value={g}>{g}</option>)}
          </select></div>
      </div>
      <div className="field"><label>City</label><input type="text" value={f.city} onChange={set("city")} /></div>
      {problems.map((p) => <Alert key={p} kind="error">{p}</Alert>)}
      <ErrorBox error={error} />
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
    </form>
  );
}

/** Login / Register page (the only page visible without a session). */
export default function Login() {
  const { flash, startSession } = useAuth();
  const [tab, setTab] = useState("Login");
  return (
    <div className="login-wrap">
      <div className="login-brand"><Brand /></div>
      <div className="login-note">Sign in to continue to the research platform</div>
      <div className="login-card">
        {flash && <Alert kind="warn">{flash}</Alert>}
        <Tabs tabs={["Login", "Register"]} active={tab} onChange={setTab} />
        {tab === "Login" ? <LoginForm onSession={startSession} /> : <RegisterForm onSession={startSession} />}
      </div>
    </div>
  );
}
