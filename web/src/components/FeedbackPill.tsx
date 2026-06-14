import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { submitFeedback } from "../lib/api";
import { isApiConfigured } from "../lib/config";
import { useAuth } from "../lib/auth";
import { useToast } from "./Toast";

const CATEGORIES = ["Idea", "Bug", "Praise", "Other"];

// Floating feedback pill. Bottom-left (the chat assistant sits bottom-right).
// Submits via the public API so guests and signed-out visitors can send too.
export default function FeedbackPill() {
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Idea");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isApiConfigured) return null; // feedback needs the live API

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = message.trim();
    if (!msg || busy) return;
    setBusy(true);
    try {
      await submitFeedback({
        category,
        message: msg,
        email: (user?.email || email).trim() || undefined,
        path: window.location.pathname,
      });
      setSent(true);
      setMessage("");
      toast.show("Thanks for the feedback! 🌿", "ok");
      setTimeout(() => { setOpen(false); setSent(false); }, 1200);
    } catch (err) {
      toast.show((err as Error).message || "Couldn't send — try again.", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className={`fb-fab${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close feedback" : "Send feedback"}
      >
        {open ? "✕" : "💬"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fb-panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="fb-head">
              <span className="fb-title">Share feedback</span>
              <span className="fb-sub">Ideas, bugs, or just hi — we read every one.</span>
            </div>
            <form className="fb-body" onSubmit={submit}>
              <div className="fb-cats">
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={`fb-chip${category === c ? " on" : ""}`}
                    onClick={() => setCategory(c)}
                    aria-pressed={category === c}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <textarea
                className="field"
                rows={4}
                placeholder="What's on your mind?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {!user && (
                <input
                  className="field"
                  type="email"
                  placeholder="Email (optional, for a reply)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
              <button className="btn block" type="submit" disabled={busy || !message.trim()}>
                {busy ? "Sending…" : sent ? "Sent ✓" : "Send feedback"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
