import { useCallback, useEffect, useState } from "react";
import * as api from "../api";
import { useAuth } from "../auth";
import { Alert, ErrorBox, Expander, Icon, PageTitle, SectionTitle } from "../components/ui";
import { fmtCompact, fmtDate, initials, profileLinks, publicUrl, shareLinks } from "../utils";

const SHARE_STYLE = { WhatsApp: ["wa", "whatsapp"], Facebook: ["fb", "facebook"], X: ["x", "twitter-x"], LinkedIn: ["in", "linkedin"] };
const FOLLOW_STYLE = { Instagram: ["ig", "instagram"], Facebook: ["fb", "facebook"], YouTube: ["yt", "youtube"] };

function ShareRow({ url, text }) {
  return (
    <div className="share-row">
      {Object.entries(shareLinks(url, text)).map(([name, href]) => (
        <a key={name} className={`share-btn ${SHARE_STYLE[name][0]}`} href={href} target="_blank" rel="noopener noreferrer">
          <Icon name={SHARE_STYLE[name][1]} /> {name}
        </a>
      ))}
    </div>
  );
}

const FIELDS = [
  ["likes", "Likes", "likes_delta", "Likes change (+)"],
  ["shares", "Shares", "shares_delta", "Shares change (+)"],
  ["comments", "Comments", "comments_delta", "Comments change (+)"],
  ["followers", "Followers", "followers_delta", "Followers change (+)"],
];

function AdminStats({ stats }) {
  const [platform, setPlatform] = useState("instagram");
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null); // {kind, text}
  const [error, setError] = useState(null);

  useEffect(() => {
    const cur = stats[platform] || {};
    const next = {};
    FIELDS.forEach(([a, , b]) => { next[a] = Number(cur[a] || 0); next[b] = Number(cur[b] || 0); });
    setForm(next);
  }, [platform, stats]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setMsg(null); setError(null);
    const payload = { platform };
    FIELDS.forEach(([a, , b]) => {
      payload[a] = Math.max(0, parseInt(form[a], 10) || 0);
      payload[b] = parseInt(form[b], 10) || 0;
    });
    try {
      await api.updateSocialStats(payload);
      setMsg({ kind: "success", text: "Saved. The dashboard shows the new numbers on its next refresh." });
    } catch (err) { setError(err); }
  };

  const sync = async () => {
    setMsg(null); setError(null);
    try {
      const res = await api.syncSocial();
      setMsg({ kind: res.synced ? "success" : "info", text: res.reason || `Synced: ${JSON.stringify(res.updated)}` });
    } catch (err) { setError(err); }
  };

  return (
    <>
      <div className="field" style={{ maxWidth: 260 }}>
        <label>Platform</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}><option>instagram</option><option>facebook</option></select>
      </div>
      <form onSubmit={save}>
        <div className="form-row">
          {FIELDS.flatMap(([a, la, b, lb]) => [
            <div className="field" key={a}><label>{la}</label><input type="number" min={0} value={form[a] ?? 0} onChange={set(a)} /></div>,
            <div className="field" key={b}><label>{lb}</label><input type="number" value={form[b] ?? 0} onChange={set(b)} /></div>,
          ])}
        </div>
        <button className="btn btn-primary" type="submit">Save numbers</button>
      </form>
      <div style={{ marginTop: 12 }}><button type="button" className="btn" onClick={sync}>Sync from Meta Graph API</button></div>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <ErrorBox error={error} />
    </>
  );
}

/** Social Media: share buttons, profile links, admin stats editor and the community feed. */
export default function SocialMedia() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const base = publicUrl();
  const [stats, setStats] = useState({});
  const [statsError, setStatsError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsError, setPostsError] = useState(null);
  const [content, setContent] = useState("");
  const [postError, setPostError] = useState(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    api.socialStats().then((list) => setStats(Object.fromEntries(list.map((s) => [s.platform, s])))).catch((e) => e.status !== 401 && setStatsError(e));
  }, []);

  const loadPosts = useCallback(() => {
    return api.socialPosts().then((p) => { setPosts(p); setPostsError(null); }).catch((e) => setPostsError(e));
  }, []);
  useEffect(() => { loadPosts(); }, [loadPosts]);

  const post = async (e) => {
    e.preventDefault();
    setLocalError(""); setPostError(null);
    if (!content.trim()) { setLocalError("Write something before posting."); return; }
    try {
      await api.createPost(content.trim());
      setContent("");
    } catch (err) { setPostError(err); }
    loadPosts();
  };

  const ig = stats.instagram, fb = stats.facebook;
  return (
    <div className="stack">
      <PageTitle title="Social Media" subtitle="Share the platform, follow our channels and join the community feed." />
      <div className="grid-2">
        <div className="card bordered">
          <h4>Share</h4>
          <div className="share-label">Survey link</div>
          <ShareRow url={`${base}/surveys`} text="Take part in our research survey" />
          <div className="share-label">Dashboard link</div>
          <ShareRow url={`${base}/dashboard`} text="Explore the Soul Sanctuary research dashboard" />
        </div>
        <div className="card bordered">
          <h4>Follow us</h4>
          <div className="share-row">
            {Object.entries(profileLinks()).map(([name, url]) => (
              <a key={name} className={`share-btn ${FOLLOW_STYLE[name][0]}`} href={url} target="_blank" rel="noopener noreferrer">
                <Icon name={FOLLOW_STYLE[name][1]} /> {name}
              </a>
            ))}
          </div>
          {statsError ? <ErrorBox error={statsError} /> : (
            <div className="caption">Instagram followers {fmtCompact(ig ? ig.followers : 0)} {"\u2022"} Facebook likes {fmtCompact(fb ? fb.likes : 0)}</div>
          )}
        </div>
      </div>

      {isAdmin && <Expander title="Admin: update social media numbers"><AdminStats stats={stats} /></Expander>}

      <SectionTitle>Community feed</SectionTitle>
      <form onSubmit={post}>
        <div className="field">
          <label>Share something with the community</label>
          <textarea maxLength={1000} rows={3} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <Alert kind="error">{localError}</Alert>
        <ErrorBox error={postError} />
        <button className="btn btn-primary" type="submit">Post</button>
      </form>

      <ErrorBox error={postsError} />
      {!posts.length && !postsError && <Alert kind="info">No posts yet. Be the first to share something.</Alert>}
      {posts.slice(0, 50).map((p) => (
        <div className="post" key={p.id}>
          <div className="post-head">
            <span className="avatar avatar-sm" style={{ margin: 0 }}>{initials(p.author)}</span>
            <div><div className="post-author">{p.author}</div><div className="post-time">{fmtDate(p.created_at)}</div></div>
          </div>
          <div className="post-body">{p.content}</div>
        </div>
      ))}
    </div>
  );
}
