import { Link } from "react-router-dom";
import AppBar from "../components/AppBar";
import VideoEmbed from "../components/VideoEmbed";
import { articles } from "../data/learn";
import { PHOTOS } from "../data/process";
import { wineTypeGuides } from "../data/learn";

const VIDEOS = [
  { id: "XLHb-b2sAss", title: "How Wine Is Made — From Grape to Glass" },
  { id: "6YpbGkf-aqI", title: "Wine for Beginners — Everything You Need to Know" },
];

export default function Learn() {
  return (
    <>
      <AppBar title="Learn" back />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">Wine 101</span>
          <h1>Learn the Vine</h1>
          <p>
            What wine is, how it's made, and what sets each style apart —
            the foundation for a great tasting.
          </p>
        </div>

        <figure className="learn-hero">
          <img
            src={PHOTOS.vineyard}
            alt="Vineyard terraces in autumn"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.currentTarget.closest("figure") as HTMLElement).style.display = "none"; }}
          />
          <figcaption>Lavaux vineyard terraces · Wikimedia Commons (CC)</figcaption>
        </figure>

        <div className="section-head">
          <span className="kicker">Start here</span>
          <h2>How to Taste</h2>
        </div>
        <Link to="/learn/how-to-taste-wine" className="journey-cta tap">
          <div className="journey-scene" style={{ display: "grid", placeItems: "center", fontSize: 44 }}>🍷</div>
          <div className="journey-body">
            <div className="journey-title">The WSET Tasting Method</div>
            <p>Look, smell, taste, conclude — a structured approach to any glass of wine.</p>
            <span className="journey-go">Learn to taste →</span>
          </div>
        </Link>

        <div className="section-head">
          <span className="kicker">Wine styles</span>
          <h2>The Six Types</h2>
        </div>
        <div className="list">
          {wineTypeGuides.map((e) => (
            <div key={e.wineType} className="card">
              <div className="exp-row">
                <div className="swatch" style={{ background: e.accent }} />
                <div>
                  <div className="ttl">{e.wineType}</div>
                  <div className="ag">{e.description}</div>
                  <div className="pf">{e.profile}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="section-head">
          <span className="kicker">Articles</span>
          <h2>Essential Reading</h2>
        </div>
        <div className="list">
          {articles.map((a) => (
            <Link key={a.slug} to={`/learn/${a.slug}`} className="card tap" style={{ display: "block" }}>
              <span className="kicker">{a.kicker}</span>
              <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 17, marginTop: 3 }}>{a.title}</div>
              <div className="muted" style={{ marginTop: 3 }}>{a.subtitle}</div>
            </Link>
          ))}
        </div>

        <div className="section-head">
          <span className="kicker">Watch</span>
          <h2>Videos</h2>
        </div>
        <div className="list">
          {VIDEOS.map((v) => (
            <VideoEmbed key={v.id} id={v.id} title={v.title} />
          ))}
        </div>

        <div className="section-head">
          <span className="kicker">Deep dive</span>
          <h2>How Wine Is Made</h2>
        </div>
        <Link to="/learn/process" className="journey-cta tap">
          <div className="journey-scene" style={{ display: "grid", placeItems: "center", fontSize: 44 }}>🍇</div>
          <div className="journey-body">
            <div className="journey-title">The 8-stage journey</div>
            <p>Vineyard to bottle — tap through an interactive, illustrated walkthrough of how wine is made.</p>
            <span className="journey-go">Start the journey →</span>
          </div>
        </Link>
      </main>
    </>
  );
}
