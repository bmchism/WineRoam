import { useParams, Navigate } from "react-router-dom";
import AppBar from "../components/AppBar";
import TastingGuide from "../components/TastingGuide";
import { articleBySlug } from "../data/learn";

export default function LearnArticle() {
  const { slug } = useParams();
  const a = slug ? articleBySlug(slug) : undefined;
  if (!a) return <Navigate to="/learn" replace />;

  // The tasting how-to gets a dedicated rich, interactive layout.
  if (slug === "how-to-taste-wine") return <TastingGuide />;

  return (
    <>
      <AppBar title="Learn" back />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">{a.kicker}</span>
          <h1>{a.title}</h1>
          <p>{a.subtitle}</p>
        </div>

        <div className="stack" style={{ marginTop: 18 }}>
          {a.sections.map((s) => (
            <div className="card" key={s.heading}>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "0 0 8px" }}>
                {s.heading}
              </h2>
              <p className="lead" style={{ margin: 0 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
