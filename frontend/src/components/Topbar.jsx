import { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../auth";
import { Brand, ErrorBox, Icon, Popover, UserChip } from "./ui";

const PAGES = [
  ["Dashboard", "/dashboard"], ["Surveys", "/surveys"], ["Data", "/data"], ["Analytics", "/analytics"], ["Social Media", "/social-media"],
];

function SearchPanel() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResult(null); setError(null); return undefined; }
    const t = setTimeout(() => {
      api.search(term).then((r) => { setResult(r); setError(null); }).catch((e) => { setError(e); setResult(null); });
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <div className="field" style={{ marginBottom: 8 }}>
        <label>Search surveys and projects</label>
        <input type="text" autoFocus value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ErrorBox error={error} />
      {result && !result.surveys.length && !result.projects.length && <div className="caption">No matches.</div>}
      {result && result.surveys.map((s) => <p className="pop-line" key={`s${s.id ?? s.title}`}><b>Survey</b> - {s.title} ({s.status})</p>)}
      {result && result.projects.map((p) => <p className="pop-line" key={`p${p.id ?? p.name}`}><b>Project</b> - {p.name} ({p.status.replace(/_/g, " ")})</p>)}
    </div>
  );
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(null); // "search" | "bell" | "user" | null
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    api.notifications().then(setAlerts).catch(() => setAlerts([]));
    setOpen(null);
  }, [location.pathname]);

  const toggle = (name) => () => setOpen((cur) => (cur === name ? null : name));

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Brand />
        <nav className="nav">
          {PAGES.map(([label, to]) => <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>{label}</NavLink>)}
        </nav>
        <div className="top-icons">
          <Popover open={open === "search"} onToggle={toggle("search")} onClose={close}
            trigger={(o, t) => <button type="button" className="icon-btn" onClick={t} aria-label="Search"><Icon name="search" /></button>}>
            <SearchPanel />
          </Popover>
          <Popover open={open === "bell"} onToggle={toggle("bell")} onClose={close}
            trigger={(o, t) => <button type="button" className={`icon-btn${alerts.length ? " dot" : ""}`} onClick={t} aria-label="Notifications"><Icon name="bell" /></button>}>
            {alerts.length ? <ul>{alerts.map((a, i) => <li key={i}>{a}</li>)}</ul> : <div className="caption">You're all caught up.</div>}
          </Popover>
        </div>
        <div className="user-wrap">
          <UserChip name={user.name} role={user.role} avatarUrl={user.avatar_url} />
          <Popover open={open === "user"} onToggle={toggle("user")} onClose={close}
            trigger={(o, t) => <button type="button" className="icon-btn" onClick={t} aria-label="User menu"><Icon name="chevron-down" /></button>}>
            <div style={{ marginBottom: 10 }}><b>{user.name}</b><br />{user.email}</div>
            <button type="button" className="btn btn-sm" onClick={logout}><Icon name="box-arrow-right" /> Log out</button>
          </Popover>
        </div>
      </div>
    </header>
  );
}
