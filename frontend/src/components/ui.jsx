import { useEffect, useRef } from "react";
import { fmtCompact, fmtDate, fmtDelta, fmtInt, initials } from "../utils";

export const Icon = ({ name, className = "" }) => <i className={`bi bi-${name} ${className}`} />;

// ------------------------------------------------------------------ header pieces
export function Brand() {
  return (
    <div className="brand">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#0f3d56" strokeWidth="2.2" strokeLinecap="round">
          <path d="M20 20 L20 7" /><path d="M20 20 L31 26.5" /><path d="M20 20 L9 26.5" /><path d="M20 7 L31 13.5" />
        </g>
        <circle cx="20" cy="20" r="5.2" fill="#009a9f" /><circle cx="20" cy="6.5" r="4.2" fill="#009a9f" />
        <circle cx="31.5" cy="26.8" r="4.2" fill="#0f3d56" /><circle cx="8.5" cy="26.8" r="4.2" fill="#009a9f" />
        <circle cx="31.5" cy="13.2" r="3.2" fill="#009a9f" />
      </svg>
      <div className="brand-title">Research &amp; Data<br />Management</div>
    </div>
  );
}

export function UserChip({ name, role, avatarUrl }) {
  return (
    <div className="user-chip">
      {avatarUrl ? <img className="avatar" src={avatarUrl} alt="" /> : <span className="avatar avatar-initials">{initials(name)}</span>}
      <div className="user-meta">
        <div className="user-name">{name}</div>
        <div className="user-role">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
      </div>
    </div>
  );
}

export const PageTitle = ({ title, subtitle }) => (
  <div className="page-title"><h1>{title}</h1><p>{subtitle}</p></div>
);
export const SectionTitle = ({ children }) => <h2 className="section-title">{children}</h2>;
export const Caption = ({ children }) => <div className="chart-caption">{children}</div>;
export const ChartTitle = ({ children }) => <div className="chart-title">{children}</div>;

// ------------------------------------------------------------------ KPI cards
const KPI_ICONS = { teal: "people-fill", purple: "card-checklist", blue: "bar-chart-fill", orange: "database-fill" };

function Delta({ kpi, arrow = false }) {
  if (kpi.delta_text) {
    return <div className="kpi-delta">{arrow ? "\u2197 " : ""}{kpi.delta_text}</div>;
  }
  if (kpi.delta_pct == null) return <div className="kpi-delta muted">No data for last month</div>;
  const neg = kpi.delta_pct < 0;
  const sign = kpi.delta_pct >= 0 ? "+" : "";
  return (
    <div className={`kpi-delta${neg ? " neg" : ""}`}>
      {arrow ? (neg ? "\u2198 " : "\u2197 ") : ""}{`${sign}${kpi.delta_pct.toFixed(1)}% vs last month`}
    </div>
  );
}

function KpiCard({ label, kpi, tone, arrow }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-tile tone-${tone}`}><Icon name={KPI_ICONS[tone]} /></div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{fmtInt(kpi.value)}</div>
        <Delta kpi={kpi} arrow={arrow} />
      </div>
    </div>
  );
}

export function KpiRow({ summary }) {
  return (
    <div className="kpi-grid">
      <KpiCard label="Total Registrations / Sign-ups" kpi={summary.registrations} tone="teal" arrow />
      <KpiCard label="Completed Surveys" kpi={summary.completed_surveys} tone="purple" />
      <KpiCard label="Active Surveys" kpi={summary.active_surveys} tone="blue" arrow />
      <KpiCard label="Data Entries" kpi={summary.data_entries} tone="orange" />
    </div>
  );
}

// ------------------------------------------------------------------ pills + tables
const PILLS = {
  completed: ["Completed", "green"], processed: ["Processed", "green"], active: ["Active", "indigo"],
  draft: ["Draft", "amber"], pending_review: ["Pending Review", "yellow"],
};

export function StatusPill({ status }) {
  const [label, tone] = PILLS[status] || [status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), "indigo"];
  return <span className={`pill pill-${tone}`}>{label}</span>;
}

/** rows: array of arrays of React nodes. */
export function DataTable({ headers, rows, numbered = true, emptyText = "Nothing to show yet.", emptyHint = "" }) {
  const cols = headers.length + (numbered ? 1 : 0);
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {numbered && <th className="num" />}
            {headers.map((h) => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, i) => (
            <tr key={i}>
              {numbered && <td className="num">{i + 1}</td>}
              {row.map((cell, j) => <td key={j}>{cell}</td>)}
            </tr>
          )) : (
            <tr>
              <td colSpan={cols} className="empty">
                {emptyText}
                {emptyHint && <div className="empty-hint">{emptyHint}</div>}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export const OwnerCell = ({ name }) => (
  <span className="owner"><span className="avatar avatar-sm">{initials(name)}</span>{name}</span>
);

/** Instagram card table: Survey | Responses | Status | Date | Action. */
export function SurveysTable({ rows }) {
  return (
    <DataTable
      headers={["Survey", "Responses", "Status", "Date", "Action"]}
      rows={rows.map((r) => [r.title, `${fmtInt(r.responses)} responses`, <StatusPill status={r.status} />, fmtDate(r.date),
        <span className="action-link">{r.action}</span>])}
      emptyText="No surveys yet." emptyHint="Use + New Survey to create the first one."
    />
  );
}

/** Facebook card table: Project | Data Entries | Last Updated | Owner | Status. */
export function ProjectsTable({ rows, numbered = true }) {
  return (
    <DataTable
      headers={["Project", "Data Entries", "Last Updated", "Owner", "Status"]} numbered={numbered}
      rows={rows.map((r) => [r.name, `${fmtInt(r.entries)} entries`, fmtDate(r.last_updated), <OwnerCell name={r.owner} />,
        <StatusPill status={r.status} />])}
      emptyText="No projects yet."
    />
  );
}

// ------------------------------------------------------------------ social cards
export function InstagramCard({ ig, surveyRows }) {
  return (
    <div className="social-card">
      <div className="soc-head">
        <div className="soc-brand">
          <span className="ig-badge"><Icon name="instagram" /></span>
          <div><div className="soc-name">Instagram</div><div className="soc-lbl">Likes ({fmtDelta(ig.likes_delta, true)})</div></div>
        </div>
        <div className="soc-stat"><Icon name="heart-fill" className="soc-stat-icon" />
          <div><div className="soc-num">{fmtCompact(ig.shares)}</div><div className="soc-lbl">Shares ({fmtDelta(ig.shares_delta)})</div></div></div>
        <div className="soc-stat"><Icon name="chat-fill" className="soc-stat-icon blue" />
          <div><div className="soc-num">{fmtCompact(ig.comments)}</div><div className="soc-lbl">Comments ({fmtDelta(ig.comments_delta)})</div></div></div>
        <div className="soc-stat"><Icon name="people-fill" className="soc-stat-icon blue" />
          <div><div className="soc-num">{fmtCompact(ig.followers)}</div><div className="soc-lbl">Followers ({fmtDelta(ig.followers_delta)})</div></div></div>
      </div>
      <SurveysTable rows={surveyRows} />
    </div>
  );
}

export function FacebookCard({ fb, projectRows }) {
  return (
    <div className="social-card">
      <div className="soc-head">
        <div className="soc-brand"><span className="fb-badge"><Icon name="facebook" /></span><div className="soc-name">Facebook</div></div>
        <div className="soc-stat"><Icon name="hand-thumbs-up-fill" className="soc-stat-icon fb" /><div className="soc-num">{fmtCompact(fb.likes)}</div></div>
        <div className="soc-stat"><Icon name="share-fill" className="soc-stat-icon blue" /><div className="soc-lbl">Likes ({fmtDelta(fb.likes_delta)})</div></div>
      </div>
      <h3 className="soc-sub">Research / Data Management</h3>
      <ProjectsTable rows={projectRows} />
    </div>
  );
}

export function Skeleton() {
  return (
    <div>
      <div className="sk sk-title" />
      <div className="kpi-grid">
        {[0, 1, 2, 3].map((i) => (
          <div className="kpi-card" key={i}>
            <div className="sk sk-tile" />
            <div className="sk-col"><div className="sk sk-line" /><div className="sk sk-big" /><div className="sk sk-line short" /></div>
          </div>
        ))}
      </div>
      <div className="sk-charts"><div className="sk sk-chart" /><div className="sk sk-chart" /><div className="sk sk-chart" /></div>
      <div className="sk-charts two"><div className="sk sk-chart" /><div className="sk sk-chart" /></div>
    </div>
  );
}

// ------------------------------------------------------------------ generic widgets
export function Alert({ kind = "error", children }) {
  if (!children) return null;
  return <div className={`alert alert-${kind}`}>{children}</div>;
}

/** Render a backend error consistently. */
export function ErrorBox({ error }) {
  if (!error) return null;
  return <Alert kind="error">{error.status === 0 ? `Backend unavailable. ${error.detail}` : (error.detail || error.message)}</Alert>;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t} role="tab" type="button" className={`tab${active === t ? " active" : ""}`} onClick={() => onChange(t)}>{t}</button>
      ))}
    </div>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />{label}
    </label>
  );
}

export function Expander({ title, children }) {
  return (
    <details className="expander">
      <summary>{title}</summary>
      <div className="body">{children}</div>
    </details>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x-lg" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/** Small dropdown panel that closes on outside click. `trigger(open, toggle)` renders the button. */
export function Popover({ open, onToggle, onClose, trigger, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return (
    <div className="popover-wrap" ref={ref}>
      {trigger(open, onToggle)}
      {open && <div className="popover">{children}</div>}
    </div>
  );
}
