import { useCallback, useEffect, useState } from "react";
import * as api from "../api";
import { useAuth } from "../auth";
import { Alert, DataTable, ErrorBox, Expander, OwnerCell, PageTitle, StatusPill } from "../components/ui";
import { fmtDate, fmtInt } from "../utils";

const STATUS_OPTIONS = { All: "", Processed: "processed", Active: "active", "Pending Review": "pending_review" };
const ADD_STATUS = { Active: "active", Processed: "processed", "Pending Review": "pending_review" };

function AddProject({ onAdded }) {
  const [f, setF] = useState({ name: "", owner: "", entries: 0, status: "Active" });
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setError(null); setSuccess(false);
    if (f.name.trim().length < 2 || f.owner.trim().length < 2) { setMsg("Enter a project name and an owner."); return; }
    try {
      await api.createProject({ name: f.name.trim(), owner_name: f.owner.trim(), entries_count: Math.max(0, parseInt(f.entries, 10) || 0), status: ADD_STATUS[f.status] });
      setSuccess(true);
      setF({ name: "", owner: "", entries: 0, status: "Active" });
      onAdded();
    } catch (err) { setError(err); }
  };

  return (
    <form onSubmit={submit}>
      <div className="field"><label>Project name</label><input type="text" value={f.name} onChange={set("name")} /></div>
      <div className="form-row three">
        <div className="field"><label>Owner</label><input type="text" value={f.owner} onChange={set("owner")} /></div>
        <div className="field"><label>Data entries</label><input type="number" min={0} step={100} value={f.entries} onChange={set("entries")} /></div>
        <div className="field"><label>Status</label>
          <select value={f.status} onChange={set("status")}>{Object.keys(ADD_STATUS).map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
      <Alert kind="error">{msg}</Alert>
      <ErrorBox error={error} />
      {success && <Alert kind="success">Project added.</Alert>}
      <button className="btn btn-primary" type="submit">Add project</button>
    </form>
  );
}

/** Data: full projects table with search and status filter. */
export default function Data() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [search, setSearch] = useState("");
  const [statusLabel, setStatusLabel] = useState("All");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    return api.projects(search.trim(), STATUS_OPTIONS[statusLabel])
      .then((r) => { setResult(r); setError(null); })
      .catch((e) => { if (e.status !== 401) setError(e); });
  }, [search, statusLabel]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const items = result ? result.items : [];
  return (
    <div className="stack">
      <PageTitle title="Data" subtitle="All research projects and datasets." />
      <div className="filters">
        <div className="field"><label>Search by project or owner</label>
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="field"><label>Status</label>
          <select value={statusLabel} onChange={(e) => setStatusLabel(e.target.value)}>{Object.keys(STATUS_OPTIONS).map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
      <ErrorBox error={error} />
      {result && (
        <>
          <div className="chip-row">
            <div className="mini-kpi"><b>{fmtInt(result.total)}</b><span>Projects</span></div>
            <div className="mini-kpi"><b>{fmtInt(result.total_entries)}</b><span>Data entries</span></div>
          </div>
          <div className="card">
            <DataTable headers={["Project", "Data Entries", "Last Updated", "Owner", "Status"]} emptyText="No projects yet."
              rows={items.map((p) => [p.name, `${fmtInt(p.entries_count)} entries`, fmtDate(p.last_updated), <OwnerCell name={p.owner_name} />, <StatusPill status={p.status} />])} />
          </div>
          {result.total > items.length && (
            <div className="caption">Showing the {items.length} most recently updated of {fmtInt(result.total)} projects. Refine the search to see others.</div>
          )}
        </>
      )}
      {isAdmin && <Expander title="Add a project"><AddProject onAdded={load} /></Expander>}
    </div>
  );
}
