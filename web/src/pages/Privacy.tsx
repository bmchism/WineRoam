import { Link } from "react-router-dom";
import AppBar from "../components/AppBar";
import LegalFooter from "../components/LegalFooter";

const EFFECTIVE = "June 7, 2026";

export default function Privacy() {
  return (
    <>
      <AppBar title="Privacy Policy" back />
      <main className="screen info">
        <div className="page-title">
          <span className="kicker">Effective {EFFECTIVE}</span>
          <h1>Privacy Policy</h1>
        </div>

        <p className="lead">
          This policy explains what Wine Roam collects, how we use it, and the
          choices you have. We keep it short and collect as little as possible.
        </p>

        <div className="section-head"><span className="kicker">1</span><h2>Information we collect</h2></div>
        <ul className="info-list">
          <li><strong>Account info</strong> — your email and display name, managed through Amazon Cognito. If you sign in with Google, we receive your email and name from Google.</li>
          <li><strong>Your content</strong> — tasting ratings, notes, shelf items, and any reviews you write. Notes are stored on your device and synced to your account when you’re signed in.</li>
          <li><strong>Photos</strong> — labels you scan or bottle photos you upload, used to identify bottles and improve listings.</li>
          <li><strong>Usage</strong> — anonymous, aggregate event counts (e.g. a page was viewed) to understand what’s used. We do not store your browsing path or sell data.</li>
          <li><strong>Notifications</strong> — if you opt in, a push subscription, email, or phone number so we can send tasting reminders you requested.</li>
        </ul>

        <div className="section-head"><span className="kicker">2</span><h2>How we use it</h2></div>
        <p>
          To run the app: sign you in, sync your shelf and notes, identify bottles,
          generate quizzes and tasting guidance, deliver reminders you ask for, and
          keep the service secure. We do not sell your personal information.
        </p>

        <div className="section-head"><span className="kicker">3</span><h2>AI processing</h2></div>
        <p>
          Bottle scanning, the chat assistant, and quiz generation send the relevant
          input (such as a label image or your question) to our AI provider,
          Anthropic, to produce a response. This content is processed to serve your
          request and is not used to train models.
        </p>

        <div className="section-head"><span className="kicker">4</span><h2>Service providers</h2></div>
        <p>We share data only with vendors that help us operate the app:</p>
        <ul className="info-list">
          <li><strong>Amazon Web Services</strong> — hosting, database, authentication (Cognito), storage.</li>
          <li><strong>Anthropic</strong> — AI features (scanning, chat, quizzes).</li>
          <li><strong>Google</strong> — optional “Continue with Google” sign-in.</li>
          <li><strong>Resend</strong> — transactional and reminder emails.</li>
          <li><strong>Twilio</strong> — optional SMS reminders (only if you provide a number).</li>
        </ul>

        <div className="section-head"><span className="kicker">5</span><h2>Local storage &amp; cookies</h2></div>
        <p>
          We use your browser’s local storage to keep you signed in and to hold your
          notes offline. We don’t use third-party advertising or tracking cookies.
        </p>

        <div className="section-head"><span className="kicker">6</span><h2>Retention</h2></div>
        <p>
          We keep your account and content while your account is active. You can edit
          or remove your notes, reviews, and shelf at any time. Ask us to delete your
          account and we’ll remove your personal data, except where we must keep it
          for legal reasons.
        </p>

        <div className="section-head"><span className="kicker">7</span><h2>Your choices</h2></div>
        <ul className="info-list">
          <li>Access or update your profile from the app.</li>
          <li>Turn reminders (push, email, SMS) on or off at any time.</li>
          <li>Request a copy or deletion of your data by contacting us.</li>
        </ul>

        <div className="section-head"><span className="kicker">8</span><h2>Children</h2></div>
        <p>
          Wine Roam is for adults of legal drinking age (21+ in the United States).
          It is not directed to children and we do not knowingly collect their data.
        </p>

        <div className="section-head"><span className="kicker">9</span><h2>Changes &amp; contact</h2></div>
        <p>
          We’ll update this page and the effective date when this policy changes.
          Questions or requests:{" "}
          <a className="linklike" style={{ display: "inline" }} href="mailto:hello@roamthrough.com">hello@roamthrough.com</a>{" "}
          (see <Link to="/contact" className="linklike" style={{ display: "inline" }}>Contact</Link>).
        </p>

        <p className="muted" style={{ marginTop: 14, fontSize: 12.5 }}>
          This policy is provided for transparency and is not legal advice.
        </p>

        <LegalFooter />
      </main>
    </>
  );
}
