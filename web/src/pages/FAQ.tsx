import AppBar from "../components/AppBar";
import LegalFooter from "../components/LegalFooter";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Do I need an account?",
    a: "Yes to use the full app — browsing bottles, hosting tastings, saving your shelf and notes. The one exception: if someone shares a tasting link or QR code with you, you can join that tasting, see the bottles in it, take notes, and do the quiz without an account.",
  },
  {
    q: "How do guest tastings work?",
    a: "A host shares a link or QR code. You open it on your phone, add a name, and follow along — rating each pour and taking the quiz. You only get the tasting itself; the rest of the app stays behind a free account.",
  },
  {
    q: "How do I create an account?",
    a: "Use your email and a password, or continue with your Google account. (Apple sign-in is coming soon.) Your shelf, history, and notes then sync across your devices.",
  },
  {
    q: "What does “organic” mean?",
    a: "Wine can legally contain small amounts of organics (sweeteners, coloring, glycerin, oak extract) without disclosure. “Organic” means the bottle is made from grape, water, yeast, and time — nothing added. We focus on these expressions and label them where verified.",
  },
  {
    q: "How does bottle scanning work?",
    a: "Snap a label and the app identifies the bottle and pulls up its full profile. Scanning uses AI and requires an account.",
  },
  {
    q: "Are my tasting notes private?",
    a: "Yes. Personal notes are private to you. Reviews are only shared with the community if you explicitly choose to publish them. See our Privacy Policy for details.",
  },
  {
    q: "How much does it cost?",
    a: "The app is free to use.",
  },
  {
    q: "Is Wine Roam affiliated with the brands shown?",
    a: "No. We are independent. Bottle names and labels are trademarks of their owners, shown for identification and education only.",
  },
];

export default function FAQ() {
  return (
    <>
      <AppBar title="FAQ" back />
      <main className="screen info">
        <div className="page-title">
          <span className="kicker">Questions &amp; answers</span>
          <h1>Frequently Asked</h1>
        </div>

        <div className="faq-list">
          {FAQS.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>

        <LegalFooter />
      </main>
    </>
  );
}
