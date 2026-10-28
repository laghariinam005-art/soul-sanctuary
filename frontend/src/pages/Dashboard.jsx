import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../api";
import { useAuth } from "../auth";
import { DemographicsPie, RegistrationLineChart, ResponsesBarChart } from "../components/Charts";
import NewSurveyForm from "../components/NewSurveyForm";
import {
  Caption, ChartTitle, ErrorBox, FacebookCard, Icon, InstagramCard, KpiRow, Modal, PageTitle, SectionTitle, Skeleton, Toggle,
} from "../components/ui";
import { fmtDate, fmtInt } from "../utils";

/** Dashboard Overview: KPIs, analytics charts, social media + tables, all from the backend. */
export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auto, setAuto] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [exportError, setExportError] = useState(null);
  const alive = useRef(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await api.getOverview();
      if (!alive.current) return;
      setData(d); setError(null);
    } catch (err) {
      if (alive.current && err.status !== 401) { setError(err); }
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]);
  useEffect(() => {
    if (!auto) return undefined;
    const t = setInterval(() => load(true), 60000);
    return () => clearInterval(t);
  }, [auto, load]);

  const doExport = async () => {
    setExportError(null);
    try {
      const blob = await api.exportReport();
      const d = new Date();
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `soul-sanctuary-report-${stamp}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (err) { setExportError(err); }
  };

  const refreshRow = (
    <div className="refresh-row">
      <Toggle label="Auto-refresh (60s)" checked={auto} onChange={setAuto} />
      <button type="button" className="btn btn-sm" onClick={() => load()}><Icon name="arrow-clockwise" /> Refresh</button>
    </div>
  );

  if (loading && !data) return <>{refreshRow}<Skeleton /></>;
  if (error && !data) {
    return (<>{refreshRow}<ErrorBox error={error} /><div className="alert alert-info">Make sure the backend is running, then press Refresh.</div></>);
  }
  if (!data) return refreshRow;

  const s = data.summary;
  const sr = data.survey_responses, rg = data.registration_growth, dm = data.demographics;
  return (
    <div>
      {refreshRow}
      {loading ? <Skeleton /> : (
        <>
          <ErrorBox error={error} />
          <div className="title-row">
            <PageTitle title="Dashboard Overview" subtitle={`Real-time insights for research and data management \u2014 updated ${fmtDate(s.updated_at)}`} />
            {isAdmin && (
              <div className="title-actions">
                <button type="button" className="btn" onClick={doExport}><Icon name="download" /> Export Report</button>
                <button type="button" className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Survey</button>
              </div>
            )}
          </div>
          <ErrorBox error={exportError} />

          <KpiRow summary={s} />

          <div className="analytics-box">
            <SectionTitle>Analytics Overview</SectionTitle>
            <div className="grid-3">
              <div><ChartTitle>Survey Responses</ChartTitle><ResponsesBarChart labels={sr.labels} values={sr.values} />
                <Caption>Total: {fmtInt(sr.total)} Responses</Caption></div>
              <div><ChartTitle>User Registration Growth</ChartTitle><RegistrationLineChart months={rg.months} values={rg.values} />
                <Caption>YTD: +{fmtInt(rg.ytd_total)} users</Caption></div>
              <div><ChartTitle>Demographics</ChartTitle><DemographicsPie groups={dm.groups} />
                <Caption>{fmtInt(dm.total)} users with age on file</Caption></div>
            </div>
          </div>

          <SectionTitle>Social Media Integration</SectionTitle>
          <div className="grid-2">
            <InstagramCard ig={data.social.instagram} surveyRows={data.surveys_table} />
            <FacebookCard fb={data.social.facebook} projectRows={data.projects_table} />
          </div>
        </>
      )}

      {showNew && (
        <Modal title="Create new survey" onClose={() => setShowNew(false)}>
          <NewSurveyForm onCreated={() => { setShowNew(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}
