import { Link } from "react-router-dom";
import AppBar from "../components/AppBar";
import LegalFooter from "../components/LegalFooter";

export default function Contact() {
  return (
    <>
      <AppBar title="Contact" back />
      <main className="screen info">
        <div className="page-title">
          <span className="kicker">Get in touch</span>
          <h1>Contact Us</h1>
        </div>

        <p className="lead">
          Questions, feedback, a bottle we’re missing, or a privacy request — we’d
          love to hear from you.
        </p>

        <div className="card" style={{ textAlign: "center", marginTop: 8 }}>
          <div className="kicker">Email</div>
          <a className="btn block" style={{ marginTop: 12, textAlign: "center" }} href="mailto:hello@roamthrough.com">
            hello@roamthrough.com
          </a>
        </div>

        <div className="section-head"><span className="kicker">Before you write</span><h2>Quick links</h2></div>
        <ul className="info-list">
          <li>Common questions are answered in the <Link to="/faq" className="linklike" style={{ display: "inline" }}>FAQ</Link>.</li>
          <li>How we handle data: <Link to="/privacy" className="linklike" style={{ display: "inline" }}>Privacy Policy</Link>.</li>
          <li>Using the app: <Link to="/terms" className="linklike" style={{ display: "inline" }}>Terms of Service</Link>.</li>
        </ul>

        <LegalFooter />
      </main>
    </>
  );
}
