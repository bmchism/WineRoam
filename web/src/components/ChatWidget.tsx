import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { askChat } from "../lib/api";
import { isApiConfigured } from "../lib/config";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Msg = {
  role: "assistant",
  content: "Cheers! I'm your wine guide. Ask me about a grape variety, a region, winemaking techniques, or what to pour at your next tasting.",
};
const SUGGESTIONS = [
  "What's the difference between Old World and New World?",
  "Best wines under $30?",
  "Build me a 4-bottle flight",
];

// Floating wine assistant. Hovers bottom-right; opens a chat panel.
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, open]);

  if (!isApiConfigured) return null; // assistant needs the live API

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const history = msgs.filter((m) => m !== GREETING);
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await askChat(q, [...history, { role: "user", content: q }]);
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Hmm, I couldn't reach my notes. Try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className={`chat-fab${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Ask the wine assistant"}
      >
        {open ? "✕" : "🍷"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="chat-head">
              <span className="chat-title">Wine Guide</span>
              <span className="chat-sub">Ask me anything about wine</span>
            </div>

            <div className="chat-body" ref={scrollRef}>
              {msgs.map((m, i) => (
                <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>
              ))}
              {busy && <div className="chat-msg assistant typing"><span /><span /><span /></div>}
              {msgs.length === 1 && (
                <div className="chat-suggest">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="chat-chip" onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              )}
            </div>

            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about wine…"
                aria-label="Message"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send">↑</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
