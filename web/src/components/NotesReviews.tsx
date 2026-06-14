import { useEffect, useState } from "react";
import RatingControl from "./RatingControl";
import FlavorWheel, { ALL_NOTES } from "./FlavorWheel";
import {
  loadNote,
  saveNote,
  loadMyReview,
  saveMyReview,
  type MyReview,
} from "../lib/reviews";
import { listReviews, upsertReview } from "../lib/api";
import { track } from "../lib/analytics";
import { useAuth } from "../lib/auth";
import { isApiConfigured } from "../lib/config";

interface ShownReview {
  name: string;
  score: number;
  body: string;
  aroma?: number;
  palate?: number;
  finish?: number;
}
const apf = (r: { aroma?: number; palate?: number; finish?: number }) =>
  [r.aroma && `Aroma ${r.aroma}/5`, r.palate && `Palate ${r.palate}/5`, r.finish && `Finish ${r.finish}/5`].filter(Boolean).join(" · ");

// Private note (local) + a review you can publish to the community. Published
// reviews persist server-side (Cognito-authed); notes never leave the device.
export default function NotesReviews({ bottleId, accent }: { bottleId: string; accent: string }) {
  const { user } = useAuth();
  const [note, setNote] = useState(loadNote(bottleId));
  const [review, setReview] = useState<MyReview>(loadMyReview(bottleId));
  const [community, setCommunity] = useState<ShownReview[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      if (!isApiConfigured) return;
      const remote = await listReviews(bottleId);
      if (on) setCommunity(remote.map((r) => ({ name: r.displayName, score: r.score ?? 0, body: r.body, aroma: r.aroma, palate: r.palate, finish: r.finish })));
    })();
    return () => {
      on = false;
    };
  }, [bottleId]);

  const onNote = (v: string) => {
    setNote(v);
    saveNote(bottleId, v);
  };
  const noteHas = (f: string) => note.toLowerCase().includes(f.toLowerCase());
  const toggleFlavor = (f: string) => {
    if (noteHas(f)) {
      onNote(note.replace(new RegExp(`\\s*,?\\s*${f}`, "i"), "").replace(/^\s*,\s*/, "").trim());
    } else {
      onNote((note.trim() ? note.trim().replace(/,\s*$/, "") + ", " : "") + f);
    }
  };
  const onReview = (patch: Partial<MyReview>) => {
    const next = { ...review, ...patch };
    setReview(next);
    saveMyReview(bottleId, next);
  };

  const togglePublish = async () => {
    const publish = !review.published;
    onReview({ published: publish });
    if (!isApiConfigured) return;
    if (!user) {
      setStatus("Create an account to publish to the community. Your note stays saved on this device.");
      return;
    }
    try {
      await upsertReview({ bottleId, body: review.body, score: review.score || undefined, aroma: review.aroma || undefined, palate: review.palate || undefined, finish: review.finish || undefined, published: publish });
      if (publish) track("review_published");
      setStatus(publish ? "Published — pending a quick moderation check." : "Unpublished.");
      const remote = await listReviews(bottleId);
      setCommunity(remote.map((r) => ({ name: r.displayName, score: r.score ?? 0, body: r.body, aroma: r.aroma, palate: r.palate, finish: r.finish })));
    } catch (e) {
      setStatus((e as Error).message || "Couldn't save the review.");
    }
  };

  return (
    <>
      <div className="section-head">
        <span className="kicker">Private to you</span>
        <h2>Your Notes</h2>
      </div>
      <div className="card">
        <textarea className="field" rows={3} placeholder="What did you taste? Saved privately on your device…" value={note} onChange={(e) => onNote(e.target.value)} />
        <div className="muted" style={{ fontSize: 12, margin: "8px 0 10px" }}>🔒 Never shared. Tap flavors to add them:</div>
        <FlavorWheel selected={ALL_NOTES.filter(noteHas)} onToggle={toggleFlavor} />
      </div>

      <div className="section-head">
        <span className="kicker">Your review</span>
        <h2>Rate & Review</h2>
      </div>
      <div className="card stack">
        <RatingControl label="Score" value={review.score} max={10} accent={accent} onChange={(v) => onReview({ score: v })} />
        <RatingControl label="Aroma" value={review.aroma ?? 0} max={5} accent={accent} onChange={(v) => onReview({ aroma: v })} />
        <RatingControl label="Palate" value={review.palate ?? 0} max={5} accent={accent} onChange={(v) => onReview({ palate: v })} />
        <RatingControl label="Finish" value={review.finish ?? 0} max={5} accent={accent} onChange={(v) => onReview({ finish: v })} />
        <textarea className="field" rows={2} placeholder="Write a short review…" value={review.body} onChange={(e) => onReview({ body: e.target.value })} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>Publish to community</div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              {review.published ? "Visible on this bottle" : "Private until you turn this on"}
            </div>
          </div>
          <button className={`toggle${review.published ? " on" : ""}`} onClick={togglePublish} aria-pressed={review.published}>
            <span className="knob" />
          </button>
        </div>
        {status && <div className="muted" style={{ fontSize: 12.5 }}>{status}</div>}
      </div>

      <div className="section-head">
        <span className="kicker">Community</span>
        <h2>Reviews</h2>
      </div>
      {community.length > 0 && (() => {
        const avg = (k: "aroma" | "palate" | "finish") => {
          const vs = community.map((c) => c[k]).filter((v): v is number => !!v);
          return vs.length ? (vs.reduce((s, v) => s + v, 0) / vs.length).toFixed(1) : null;
        };
        const a = avg("aroma"), p = avg("palate"), f = avg("finish");
        if (!a && !p && !f) return null;
        return (
          <div className="card" style={{ marginBottom: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
            {a && <span><strong>{a}</strong><span className="muted" style={{ fontSize: 12 }}> avg aroma</span></span>}
            {p && <span><strong>{p}</strong><span className="muted" style={{ fontSize: 12 }}> avg palate</span></span>}
            {f && <span><strong>{f}</strong><span className="muted" style={{ fontSize: 12 }}> avg finish</span></span>}
            <span className="muted" style={{ fontSize: 12 }}>· {community.length} review{community.length === 1 ? "" : "s"}</span>
          </div>
        );
      })()}
      <div className="list">
        {review.published && review.body && (
          <div className="card" style={{ borderColor: accent }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>You</span>
              <span className="bar-score">{review.score || "—"}/10</span>
            </div>
            <p className="lead" style={{ margin: "6px 0 0", fontSize: 14.5 }}>{review.body}</p>
            {apf(review) && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{apf(review)}</div>}
          </div>
        )}
        {community.map((c, i) => (
          <div className="card" key={i}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <span className="bar-score">{c.score}/10</span>
            </div>
            <p className="lead" style={{ margin: "6px 0 0", fontSize: 14.5 }}>{c.body}</p>
            {apf(c) && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{apf(c)}</div>}
          </div>
        ))}
        {community.length === 0 && !(review.published && review.body) && (
          <div className="muted" style={{ fontSize: 14, padding: "4px 2px" }}>
            No community reviews yet — publish yours to be the first.
          </div>
        )}
      </div>
    </>
  );
}
