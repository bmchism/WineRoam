import { Link } from "react-router-dom";
import AppBar from "../components/AppBar";
import LegalFooter from "../components/LegalFooter";

const EFFECTIVE = "June 7, 2026";

export default function Terms() {
  return (
    <>
      <AppBar title="Terms of Service" back />
      <main className="screen info">
        <div className="page-title">
          <span className="kicker">Effective {EFFECTIVE}</span>
          <h1>Terms of Service</h1>
        </div>

        <p className="lead">
          By using Wine Roam you agree to these terms. Please read them — they
          include important limitations.
        </p>

        <div className="section-head"><span className="kicker">1</span><h2>Eligibility</h2></div>
        <p>
          You must be of legal drinking age in your location (21+ in the United
          States) to use Wine Roam. By using the app you confirm that you are.
          See <Link to="/responsible" className="linklike" style={{ display: "inline" }}>Responsible Drinking</Link>.
        </p>

        <div className="section-head"><span className="kicker">2</span><h2>Your account</h2></div>
        <p>
          You’re responsible for your account and for keeping your credentials
          secure. Provide accurate information and don’t share access to others.
        </p>

        <div className="section-head"><span className="kicker">3</span><h2>Acceptable use</h2></div>
        <ul className="info-list">
          <li>Don’t misuse the app, attempt to break or overload it, or access it in unauthorized ways.</li>
          <li>Don’t post unlawful, harmful, infringing, or misleading content.</li>
          <li>Don’t use the app to promote excessive or unsafe drinking.</li>
        </ul>

        <div className="section-head"><span className="kicker">4</span><h2>Your content</h2></div>
        <p>
          You own the notes and reviews you create. By publishing a review you grant
          us a non-exclusive license to display it in the app. You’re responsible for
          what you post and confirm you have the right to share it.
        </p>

        <div className="section-head"><span className="kicker">5</span><h2>Trademarks</h2></div>
        <p>
          Bottle names, labels, and logos are trademarks of their respective owners,
          shown for identification and education (nominative use). Wine Roam is
          independent and not affiliated with, sponsored by, or endorsed by any brand.
        </p>

        <div className="section-head"><span className="kicker">6</span><h2>No warranties</h2></div>
        <p>
          The app and its content — including bottle data, organic labeling, and
          AI-generated guidance — are provided “as is,” for education and enjoyment,
          and may contain errors. We make no warranties about accuracy or fitness for
          a particular purpose.
        </p>

        <div className="section-head"><span className="kicker">7</span><h2>Limitation of liability</h2></div>
        <p>
          To the maximum extent permitted by law, Wine Roam is not liable for any
          indirect, incidental, or consequential damages arising from your use of the
          app, including any decisions made based on its content.
        </p>

        <div className="section-head"><span className="kicker">8</span><h2>Changes</h2></div>
        <p>
          We may update these terms and the app over time. Continued use after changes
          means you accept the updated terms.
        </p>

        <div className="section-head"><span className="kicker">9</span><h2>Contact</h2></div>
        <p>
          Questions about these terms:{" "}
          <a className="linklike" style={{ display: "inline" }} href="mailto:hello@roamthrough.com">hello@roamthrough.com</a>.
        </p>

        <p className="muted" style={{ marginTop: 14, fontSize: 12.5 }}>
          These terms are provided for transparency and are not legal advice.
        </p>

        <LegalFooter />
      </main>
    </>
  );
}
