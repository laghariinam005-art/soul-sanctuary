import { useCallback, useEffect, useState } from "react";
import * as api from "../api";
import { useAuth } from "../auth";
import NewSurveyForm from "../components/NewSurveyForm";
import { Alert, DataTable, ErrorBox, Icon, PageTitle, StatusPill, Tabs } from "../components/ui";
import { fmtDate, fmtInt } from "../utils";

// ---------------------------------------------------------------- one question
function Question({ q, value, onChange }) {
  const label = `Q${q.number}. ${q.text}${q.required ? "" : " (optional)"}`;
  const name = `q_${q.id}`;
  let widget = null;

  if (q.type === "single_choice" || q.type === "rating") {
    widget = (
      <div className={`options${q.type === "rating" ? " horizontal" : ""}`}>
        {q.options.map((o) => (
          <label className="option" key={o.id}>
            <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} /> {o.label}
          </label>
        ))}
      </div>
    );
  } else if (q.type === "dropdown") {
    widget = (
      <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}>
        <option value="">Select an option</option>
        {q.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    );
  } else if (q.type === "multi_choice") {
    const picked = value || [];
    widget = (
      <div className="options">
        {q.options.map((o) => (
          <label className="option" key={o.id}>
            <input type="checkbox" checked={picked.includes(o.id)}
              onChange={(e) => onChange(e.target.checked ? [...picked, o.id] : picked.filter((id) => id !== o.id))} /> {o.label}
          </label>
        ))}
      </div>
    );
  } else if (q.type === "text") {
    widget = <textarea className="input" rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  } else if (q.type === "number") {
    widget = <input className="input" type="number" step="any" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <div className="q-block">
      <div className="q-label">{label}</div>
      {widget}
      {q.help_text && <div className="sv-help" style={{ marginTop: 6 }}>{q.help_text}</div>}
    </div>
  );
}

/** Turn the raw widget value into the payload the backend expects (or null when unanswered). */
function normalize(q, v) {
  switch (q.type) {
    case "single_choice": case "rating": case "dropdown":
      return v != null && v !== "" ? { question_id: q.id, option_id: Number(v) } : null;
    case "multi_choice":
      return v && v.length ? { question_id: q.id, option_ids: v } : null;
    case "text":
      return v && v.trim() ? { question_id: q.id, text_value: v.trim() } : null;
    case "number": {
      const n = parseFloat(v);
      return v !== "" && v != null && !Number.isNaN(n) ? { question_id: q.id, number_value: n } : null;
    }
    default:
      return null;
  }
}

function ThankYou({ submittedAt, again }) {
  const when = submittedAt ? ` on ${fmtDate(submittedAt)}` : "";
  const body = again
    ? `Your response was recorded${when}. Each person can submit a survey only once.`
    : `Your response was recorded${when}. It will appear in the dashboard and analytics.`;
  return (
    <div className="thanks">
      <Icon name="check-circle-fill" />
      <h2>{again ? "You have already taken this survey" : "Thank you!"}</h2>
      <p>{body}</p>
    </div>
  );
}

// ---------------------------------------------------------------- take a survey (multi-section form)
function TakeSurvey({ summary, onSubmitted }) {
  const sid = summary.id;
  const [mine, setMine] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [error, setError] = useState(null);
  const [vals, setVals] = useState({});
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [problems, setProblems] = useState([]);
  const [warning, setWarning] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.myResponse(sid).then((m) => {
      if (!alive) return null;
      setMine(m);
      return m.submitted ? null : api.surveyDetail(sid).then((s) => alive && setSurvey(s));
    }).catch((e) => alive && e.status !== 401 && setError(e));
    return () => { alive = false; };
  }, [sid]);

  if (error) return <ErrorBox error={error} />;
  if (!mine) return <div className="caption">Loading survey...</div>;
  if (mine.submitted) return <ThankYou submittedAt={mine.submitted_at} again={!done} />;
  if (!survey) return <div className="caption">Loading survey...</div>;

  const sections = survey.sections;
  const allQuestions = sections.flatMap((s) => s.questions);
  const answers = Object.fromEntries(allQuestions.map((q) => [q.id, normalize(q, vals[q.id])]).filter(([, a]) => a));
  const totalQ = allQuestions.length;
  const answered = Object.keys(answers).length;
  const sec = sections[Math.min(step, sections.length - 1)];
  const last = step === sections.length - 1;

  const missing = (qs) => qs.filter((q) => q.required && !answers[q.id]).map((q) => q.number);
  const setVal = (qid) => (v) => setVals((s) => ({ ...s, [qid]: v }));

  const next = async () => {
    setWarning("");
    const miss = missing(sec.questions);
    if (miss.length) { setProblems([`Please answer the required question(s): ${miss.map((n) => `Q${n}`).join(", ")}`]); return; }
    setProblems([]);
    if (!last) { setStep(step + 1); window.scrollTo({ top: 0 }); return; }
    const allMiss = missing(allQuestions);
    if (allMiss.length) { setProblems([`Some earlier questions are unanswered: ${allMiss.map((n) => `Q${n}`).join(", ")}`]); return; }
    setBusy(true);
    try {
      await api.submitSurvey(sid, Object.values(answers));
    } catch (err) {
      if (err.status !== 409) { setError(err); setBusy(false); return; }
    }
    setDone(true);
    try { setMine(await api.myResponse(sid)); } catch { setMine({ submitted: true }); }
    setBusy(false);
    onSubmitted && onSubmitted();
  };

  return (
    <div className="survey-card">
      <div className="sv-title">{survey.title}</div>
      {survey.description && <div className="caption">{survey.description}</div>}
      <div className="progress">
        <div className="bar"><div style={{ width: `${totalQ ? (answered / totalQ) * 100 : 0}%` }} /></div>
        <div className="txt">Section {step + 1} of {sections.length} {"\u2022"} {answered} of {totalQ} questions answered</div>
      </div>
      <div className="sv-section">{sec.title}</div>
      {sec.description && <div className="sv-purpose">{sec.description}</div>}
      {sec.questions.map((q) => <Question key={q.id} q={q} value={vals[q.id]} onChange={setVal(q.id)} />)}
      {problems.map((p) => <Alert key={p} kind="error">{p}</Alert>)}
      <Alert kind="warn">{warning}</Alert>
      <div className="survey-actions">
        <button type="button" className="btn" disabled={step === 0} onClick={() => { setProblems([]); setStep(step - 1); }}>Back</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={next}>{last ? "Submit survey" : "Next section"}</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- page
export default function Surveys() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const tabNames = ["Take a survey", "All surveys", ...(isAdmin ? ["Create survey"] : [])];
  const [tab, setTab] = useState(tabNames[0]);
  const [active, setActive] = useState(null);
  const [all, setAll] = useState(null);
  const [activeError, setActiveError] = useState(null);
  const [allError, setAllError] = useState(null);
  const [choice, setChoice] = useState(0);
  const [filter, setFilter] = useState("All");

  const loadLists = useCallback(() => {
    api.activeSurveys().then((r) => { setActive(r); setActiveError(null); }).catch((e) => { if (e.status !== 401) { setActive([]); setActiveError(e); } });
    api.listSurveys().then((r) => { setAll(r); setAllError(null); }).catch((e) => { if (e.status !== 401) { setAll([]); setAllError(e); } });
  }, []);
  useEffect(() => { loadLists(); }, [loadLists]);

  const shown = (all || []).filter((r) => filter === "All" || r.status === filter);

  return (
    <div className="stack">
      <PageTitle title="Surveys" subtitle="Take a survey, review all surveys, or create a new one." />
      <Tabs tabs={tabNames} active={tab} onChange={setTab} />

      {tab === "Take a survey" && (
        <div>
          <ErrorBox error={activeError} />
          {active && !activeError && !active.length && <Alert kind="info">There is no active survey to take right now.</Alert>}
          {active && active.length > 1 && (
            <div className="field" style={{ maxWidth: 420 }}>
              <label>Choose a survey</label>
              <select value={choice} onChange={(e) => setChoice(Number(e.target.value))}>
                {active.map((s, i) => <option key={s.id} value={i}>{s.title}</option>)}
              </select>
            </div>
          )}
          {active && active.length > 0 && (
            <TakeSurvey key={active[Math.min(choice, active.length - 1)].id} summary={active[Math.min(choice, active.length - 1)]} onSubmitted={loadLists} />
          )}
        </div>
      )}

      {tab === "All surveys" && (
        <div>
          <ErrorBox error={allError} />
          <div className="field" style={{ maxWidth: 260 }}>
            <label>Status</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {["All", "active", "draft", "completed"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="caption">{shown.length} survey(s)</div>
          <div className="card">
            <DataTable headers={["Survey", "Questions", "Responses", "Status", "Created"]} emptyText="No surveys match this filter."
              rows={shown.slice(0, 200).map((r) => [r.title, fmtInt(r.question_count), fmtInt(r.response_count), <StatusPill status={r.status} />, fmtDate(r.created_at)])} />
          </div>
          {shown.length > 200 && <div className="caption">Showing the latest 200 surveys.</div>}
        </div>
      )}

      {isAdmin && tab === "Create survey" && <NewSurveyForm onCreated={loadLists} />}
    </div>
  );
}
