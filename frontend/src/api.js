// Every call to the FastAPI backend goes through this module (JWT header, errors, timeouts).
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
const DEFAULT_TIMEOUT = 20000;
export const TOKEN_KEY = "ss_token";
export const USER_KEY = "ss_user";
export const FLASH_KEY = "ss_flash_error";

/** Raised for any failed backend call. status === 0 means the backend is unreachable. */
export class ApiError extends Error {
  constructor(status, detail) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);

function errorDetail(body, fallback) {
  if (body == null) return fallback;
  let d = typeof body === "object" && !Array.isArray(body) && "detail" in body ? body.detail : body;
  if (Array.isArray(d)) {
    // FastAPI validation errors
    return d
      .map((item) => {
        const msg = String(item.msg || "").replace("Value error, ", "");
        const loc = (item.loc || []).filter((x) => x !== "body" && x !== "query").map(String);
        return loc.length ? `${loc.join(" > ")}: ${msg}` : msg;
      })
      .join("; ");
  }
  return typeof d === "string" ? d : JSON.stringify(d);
}

async function request(method, path, { params, json, auth = true, timeout = DEFAULT_TIMEOUT, raw = false } = {}) {
  const headers = {};
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) headers["Content-Type"] = "application/json";

  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null)).toString();
    if (qs) url += `?${qs}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  let resp;
  try {
    resp = await fetch(url, { method, headers, body: json !== undefined ? JSON.stringify(json) : undefined, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") throw new ApiError(0, "The backend took too long to respond. Please try again.");
    throw new ApiError(0, `Cannot reach the backend at ${API_BASE_URL}. Start it with: cd backend && uvicorn main:app --reload`);
  } finally {
    clearTimeout(timer);
  }

  if (resp.status === 401 && auth && token) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.setItem(FLASH_KEY, "Your session expired. Please sign in again.");
    window.dispatchEvent(new Event("ss:unauthorized"));
    throw new ApiError(401, "Session expired");
  }
  if (!resp.ok) {
    let body = null;
    let text = "";
    try {
      text = await resp.text();
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    throw new ApiError(resp.status, errorDetail(body, (text || resp.statusText || "Request failed").slice(0, 300)));
  }
  if (raw) return resp.blob();
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

// ---- auth ----
export const register = (payload) => request("POST", "/auth/register", { json: payload, auth: false });
export const login = (email, password) => request("POST", "/auth/login", { json: { email, password }, auth: false });
export const me = () => request("GET", "/auth/me");

// ---- dashboard ----
export const getOverview = () => request("GET", "/dashboard/overview");
export const exportReport = () => request("GET", "/dashboard/export", { raw: true });
export const questionStats = (surveyId) => request("GET", "/dashboard/question-stats", { params: { survey_id: surveyId } });
export const search = (q) => request("GET", "/dashboard/search", { params: { q } });
export const notifications = () => request("GET", "/dashboard/notifications", { timeout: 5000 });

// ---- surveys ----
export const listSurveys = () => request("GET", "/surveys");
export const activeSurveys = () => request("GET", "/surveys/active");
export const surveyDetail = (id) => request("GET", `/surveys/${id}`);
export const myResponse = (id) => request("GET", "/surveys/my-response", { params: { survey_id: id } });
export const submitSurvey = (surveyId, answers) => request("POST", "/surveys/submit", { json: { survey_id: surveyId, answers } });
export const createSurvey = (payload) => request("POST", "/surveys", { json: payload });

// ---- projects ----
export const projects = (searchText = "", status = "") => request("GET", "/projects", { params: { search: searchText, status } });
export const createProject = (payload) => request("POST", "/projects", { json: payload });

// ---- social ----
export const socialStats = () => request("GET", "/social/stats");
export const updateSocialStats = (payload) => request("PUT", "/social/stats", { json: payload });
export const syncSocial = () => request("POST", "/social/sync", { timeout: 40000 });
export const socialPosts = () => request("GET", "/social/posts", { auth: false });
export const createPost = (content) => request("POST", "/social/posts", { json: { content } });
