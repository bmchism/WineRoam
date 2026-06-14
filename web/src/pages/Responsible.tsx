import AppBar from "../components/AppBar";
import LegalFooter from "../components/LegalFooter";

export default function Responsible() {
  return (
    <>
      <AppBar title="Responsible Drinking" back />
      <main className="screen info">
        <div className="page-title">
          <span className="kicker">Taste, don’t overdo it</span>
          <h1>Drink Responsibly</h1>
        </div>

        <p className="lead">
          Wine Roam is about appreciating great wine — its craft, aroma, and
          flavor — not drinking a lot of it. A tasting is about small pours and paying
          attention, not volume.
        </p>

        <div className="section-head"><span className="kicker">The basics</span><h2>A few ground rules</h2></div>
        <ul className="info-list">
          <li>You must be of legal drinking age (21+ in the United States) to use this app.</li>
          <li>Tasting pours are small — about ½ ounce each. Sip, don’t shoot.</li>
          <li>Have water and food on the table. Pace yourself.</li>
          <li><strong>Never drink and drive.</strong> Arrange a sober ride or stay put.</li>
          <li>Don’t pressure anyone to drink. “Skip this pour” is always a fine answer.</li>
          <li>Don’t serve anyone underage or visibly impaired.</li>
        </ul>

        <div className="section-head"><span className="kicker">If you need help</span><h2>Resources</h2></div>
        <p>
          If you or someone you know is struggling with alcohol, support is available.
          In the U.S., call the SAMHSA National Helpline at{" "}
          <a className="linklike" style={{ display: "inline" }} href="tel:18006624357">1-800-662-4357</a>{" "}
          (free, confidential, 24/7) or visit{" "}
          <a className="linklike" style={{ display: "inline" }} href="https://www.samhsa.gov/find-help/national-helpline" target="_blank" rel="noopener noreferrer">samhsa.gov</a>.
          Outside the U.S., contact your local health service.
        </p>

        <p className="muted" style={{ marginTop: 16 }}>
          Enjoy the grape. Take care of each other. 🌿
        </p>

        <LegalFooter />
      </main>
    </>
  );
}
