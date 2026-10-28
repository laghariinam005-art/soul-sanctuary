import { useState } from "react";
import * as api from "../api";
import { Alert, ErrorBox } from "./ui";

const TYPES = ["single_choice", "multi_choice", "rating", "dropdown", "text", "number"];
const blankQuestion = () => ({ text: "", type: "single_choice", required: true, options: "" });

/** Admin form that builds a survey and POSTs it. Calls onCreated() after a successful creation. */
export default function NewSurveyForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState("draft");
  const [section, setSection] = useState("Section 1");
  const [n, setN] = useState(3);
  const [questions, setQuestions] = useState([blankQuestion(), blankQuestion(), blankQuestion()]);
  const [errors, setErrors] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const setCount = (raw) => {
    const count = Math.min(30, Math.max(1, Number(raw) || 1));
    setN(count);
    setQuestions((qs) => Array.from({ length: count }, (_, i) => qs[i] || blankQuestion()));
  };
  const patch = (i, change) => setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...change } : q)));

  const submit = async () => {
    setSuccess(false);
    setApiError(null);
    const problems = [];
    if (title.trim().length < 3) problems.push("Enter a survey title (at least 3 characters).");
    const empty = questions.map((q, i) => (q.text.trim().length < 3 ? i + 1 : null)).filter(Boolean);
    if (empty.length) problems.push(`Write the text of question(s): ${empty.join(", ")}`);
    setErrors(problems);
    if (problems.length) return;
    setBusy(true);
    try {
      await api.createSurvey({
        title: title.trim(), description: desc.trim() || null, status,
        sections: [{
          title: section.trim() || "Section 1",
          questions: questions.map((q) => ({
            text: q.text.trim(), type: q.type, required: q.required,
            options: q.options.split("\n").map((o) => o.trim()).filter(Boolean),
          })),
        }],
      });
      setSuccess(true);
      setTitle(""); setDesc(""); setStatus("draft"); setSection("Section 1"); setN(3);
      setQuestions([blankQuestion(), blankQuestion(), blankQuestion()]);
      onCreated && onCreated();
    } catch (err) {
      setApiError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="field">
        <label>Survey title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Community Feedback 2026" />
      </div>
      <div className="field">
        <label>Description (optional)</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div className="form-row">
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">draft</option><option value="active">active</option><option value="completed">completed</option>
          </select>
          <span className="hint">Only active surveys can be taken by users.</span>
        </div>
        <div className="field">
          <label>Section title</label>
          <input type="text" value={section} onChange={(e) => setSection(e.target.value)} />
        </div>
      </div>
      <div className="field" style={{ maxWidth: 220 }}>
        <label>Number of questions</label>
        <input type="number" min={1} max={30} step={1} value={n} onChange={(e) => setCount(e.target.value)} />
      </div>

      {questions.map((q, i) => (
        <div className="card bordered" style={{ marginBottom: 12 }} key={i}>
          <div className="field">
            <label>Question {i + 1}</label>
            <input type="text" value={q.text} onChange={(e) => patch(i, { text: e.target.value })} />
          </div>
          <div className="form-row" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "end" }}>
            <div className="field">
              <label>Type</label>
              <select value={q.type} onChange={(e) => patch(i, { type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <label className="checkline field">
              <input type="checkbox" checked={q.required} onChange={(e) => patch(i, { required: e.target.checked })} /> Required
            </label>
          </div>
          {["single_choice", "multi_choice", "dropdown"].includes(q.type) && (
            <div className="field">
              <label>Options (one per line)</label>
              <textarea value={q.options} onChange={(e) => patch(i, { options: e.target.value })} />
            </div>
          )}
          {q.type === "rating" && (
            <div className="field">
              <label>Rating labels (one per line, leave empty for Strongly Disagree ... Strongly Agree)</label>
              <textarea value={q.options} onChange={(e) => patch(i, { options: e.target.value })} />
            </div>
          )}
        </div>
      ))}

      {errors.map((e) => <Alert key={e} kind="error">{e}</Alert>)}
      <ErrorBox error={apiError} />
      {success && <Alert kind="success">Survey created.</Alert>}
      <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? "Creating..." : "Create survey"}</button>
    </div>
  );
}
