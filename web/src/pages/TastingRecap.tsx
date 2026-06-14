import { useEffect, useRef } from "react";
import { useParams, Navigate } from "react-router-dom";
import AppBar from "../components/AppBar";
import { useToast } from "../components/Toast";
import { flightById, loadCustomFlight, bottlesForFlight, type Flight } from "../data/flights";
import { useBottlesReady } from "../lib/bottleStore";
import { loadRatings } from "../lib/tasting";
import { buildRecapHtml, recapText } from "../lib/recap";
import { sendRecap } from "../lib/api";
import { useAuth } from "../lib/auth";
import { loadProfile } from "../lib/profile";
import { summarize, recordTasting } from "../lib/history";

export default function TastingRecap() {
  const { id } = useParams();
  useBottlesReady();
  const { user } = useAuth();
  const toast = useToast();
  const recorded = useRef(false);

  const flight: Flight | null = id === "custom" ? loadCustomFlight() : id ? flightById(id) ?? null : null;

  // Save this tasting to history once (local always, account when signed in).
  useEffect(() => {
    if (!flight || recorded.current) return;
    recorded.current = true;
    const b = bottlesForFlight(flight);
    if (!b.length) return;
    recordTasting(summarize(flight, b, { mode: "solo" }), !!user);
  }, [flight?.id, user]);

  if (!flight) return <Navigate to="/tastings" replace />;

  const bottles = bottlesForFlight(flight);
  const ratings = loadRatings(flight.id);
  const prof = user ? loadProfile(user.username) : null;
  const taster = prof?.displayName || user?.name || "";
  const html = () => buildRecapHtml(flight, bottles, { taster, date: new Date().toLocaleDateString() });

  const download = () => {
    const blob = new Blob([html()], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${flight.title.replace(/\s+/g, "-").toLowerCase()}-recap.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.show("Recap downloaded ✓", "ok");
  };
  const printPdf = () => {
    const w = window.open("", "_blank");
    if (!w) return toast.show("Allow pop-ups to print/save as PDF.", "err");
    w.document.write(html());
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };
  const email = async () => {
    const to = window.prompt("Email the recap to:", user?.email || "");
    if (!to) return;
    toast.show("Sending…");
    const ok = await sendRecap({ email: to, subject: `${flight.title} — tasting recap`, html: html() }).catch(() => false);
    toast.show(ok ? "Emailed ✓" : "Couldn't email (check provider setup).", ok ? "ok" : "err");
  };
  const text = async () => {
    const to = window.prompt("Text the recap to (phone):", prof?.phone || "");
    if (!to) return;
    toast.show("Sending…");
    const ok = await sendRecap({ phone: to, text: recapText(flight, bottles) }).catch(() => false);
    toast.show(ok ? "Texted ✓" : "Couldn't text (check provider setup).", ok ? "ok" : "err");
  };

  return (
    <>
      <AppBar title="Tasting recap" back />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">{flight.title}</span>
          <h1>Your Recap</h1>
          <p>Every pour, your scores, and your notes — keep it or share it.</p>
        </div>

        <div className="card stack">
          {bottles.map((b, i) => {
            const r = ratings[b.id];
            return (
              <div key={b.id} className="pour-row" style={{ alignItems: "flex-start" }}>
                <span className="pn" style={{ background: b.accent }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pnm">{b.name}</div>
                  <div className="psub">{r ? `Overall ${r.overall}/10` : "not rated"}</div>
                  {r?.note && <div className="notes" style={{ marginTop: 6, fontSize: 14, padding: 10 }}><span className="qt">“</span>{r.note}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="section-head"><span className="kicker">Export</span><h2>Share or Save</h2></div>
        <div className="home-grid">
          <button className="home-tile tap" onClick={download}><span className="home-icn" style={{ background: "#5E8C7D" }}>⬇</span><div className="home-t">Download HTML</div></button>
          <button className="home-tile tap" onClick={printPdf}><span className="home-icn" style={{ background: "#A66A33" }}>🖨</span><div className="home-t">Print / PDF</div></button>
          <button className="home-tile tap" onClick={email}><span className="home-icn" style={{ background: "#B5651D" }}>✉</span><div className="home-t">Email it</div></button>
          <button className="home-tile tap" onClick={text}><span className="home-icn" style={{ background: "#7FA15A" }}>💬</span><div className="home-t">Text it</div></button>
        </div>
      </main>
    </>
  );
}
