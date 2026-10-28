import { useEffect, useState } from "react";
import * as api from "../api";
import { OptionBar } from "../components/Charts";
import { Alert, ErrorBox, PageTitle, SectionTitle } from "../components/ui";
import { fmtInt } from "../utils";

/** Analytics: per-question charts built from real survey answers. */
export default function Analytics() {
  const [surveys, setSurveys] = useState(null);
  const [chosenId, setChosenId] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listSurveys()
      .then((all) => {
        const withQ = all.filter((s) => s.question_count > 0);
        setSurveys(withQ);
        if (withQ.length) setChosenId(withQ[0].id);
      })
      .catch((e) => { if (e.status !== 401) setError(e); });
  }, []);

  useEffect(() => {
    if (chosenId == null) return;
    setStats(null);
    api.questionStats(chosenId).then((s) => { setStats(s); setError(null); }).catch((e) => { if (e.status !== 401) setError(e); });
  }, [chosenId]);

  return (
    <div className="stack">
      <PageTitle title="Analytics" subtitle="Answer distribution for every survey question." />
      <ErrorBox error={error} />
      {surveys && !surveys.length && <Alert kind="info">No survey with questions exists yet.</Alert>}
      {surveys && surveys.length > 0 && (
        <div className="filters">
          <div className="field"><label>Survey</label>
            <select value={chosenId ?? ""} onChange={(e) => setChosenId(Number(e.target.value))}>
              {surveys.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select></div>
        </div>
      )}
      {stats && (
        <>
          <div className="chip-row">
            <div className="mini-kpi"><b>{fmtInt(stats.total_responses)}</b><span>Completed responses</span></div>
            {stats.sections.map((s) => (
              <div className="mini-kpi" key={s.title}>
                <b>{s.mean != null ? `${s.mean.toFixed(2)} / 5` : "-"}</b><span>Average score: {s.title.split(":")[0]}</span>
              </div>
            ))}
          </div>
          {!stats.total_responses && <Alert kind="info">No responses yet. Charts will appear after the first submission.</Alert>}
          {stats.sections.map((sec) => (
            <div key={sec.title}>
              <SectionTitle>{sec.title}</SectionTitle>
              <div className="grid-2">
                {sec.questions.map((q) => (
                  <div className="card bordered" key={q.id}>
                    <p><b>Q{q.number}.</b> {q.text}</p>
                    {q.options.length ? (
                      <>
                        <OptionBar labels={q.options.map((o) => o.label)} counts={q.options.map((o) => o.count)} />
                        <div className="caption">
                          {q.answered} answered{q.mean != null ? ` \u2022 average option position ${q.mean.toFixed(2)} of ${q.options.length}` : ""}
                        </div>
                      </>
                    ) : (
                      <div className="caption">{q.answered} answered{q.mean != null ? ` \u2022 average ${q.mean}` : ""}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
