import { Link } from "react-router-dom";
import AppBar from "../components/AppBar";
import LegalFooter from "../components/LegalFooter";

export default function About() {
  return (
    <>
      <AppBar title="About" back />
      <main className="screen info">
        <div className="page-title">
          <span className="kicker">Our story</span>
          <h1>About Wine Roam</h1>
        </div>

        <p className="lead">
          Wine Roam turns any get-together into a guided wine tasting. Build a
          flight, pour with friends, and let the app walk the table through color,
          aroma, palate, and finish — then test what everyone learned with a quiz.
        </p>

        <div className="section-head"><span className="kicker">Why we built it</span><h2>Organic, demystified</h2></div>
        <p>
          Great wine is grape, water, time, and craft — nothing hidden. We focus
          on <strong>organic</strong> expressions and make it easy to learn how
          each bottle is made, what sets it apart, and how to taste it like you mean
          it. No snobbery, no gatekeeping — just a better night around the glass.
        </p>

        <div className="section-head"><span className="kicker">How it works</span><h2>Learn it. Taste it. Host it.</h2></div>
        <ul className="info-list">
          <li><strong>Learn</strong> — how wine is made and what makes each pour different.</li>
          <li><strong>Taste</strong> — guided flights that score color, aroma, palate, and finish.</li>
          <li><strong>Host</strong> — friends join by QR on their phones, rate together, then take the quiz.</li>
          <li><strong>Keep</strong> — private notes on every bottle, synced across your devices.</li>
        </ul>

        <div className="section-head"><span className="kicker">Independence</span><h2>Not affiliated with any brand</h2></div>
        <p>
          Wine Roam is independent. Bottle names, labels, and logos are trademarks
          of their respective owners and are shown for identification and education
          only. We are not affiliated with, sponsored by, or endorsed by any brand.
        </p>

        <p className="muted" style={{ marginTop: 18 }}>
          Questions? Read the <Link to="/faq" className="linklike" style={{ display: "inline" }}>FAQ</Link> or{" "}
          <Link to="/contact" className="linklike" style={{ display: "inline" }}>get in touch</Link>.
        </p>

        <LegalFooter />
      </main>
    </>
  );
}
