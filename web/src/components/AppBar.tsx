import { Fragment } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { WineMark } from "../icons";
import { appBack, crumbTrail } from "../lib/nav";
import { useAuth } from "../lib/auth";

function PowerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 3v9" />
      <path d="M7.5 6.5a7 7 0 1 0 9 0" />
    </svg>
  );
}

export default function AppBar({
  title = "Wine Roam",
  back = false,
}: {
  title?: string;
  back?: boolean;
}) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const brand = !back && title === "Wine Roam";
  // Breadcrumbs only for signed-in users: every crumb above a guest tasting page
  // (Home, Tastings, Wines…) is account-gated, so a guest tap just dead-ends at
  // the login screen. Guests navigate with the back button instead.
  const crumbs = back && user ? crumbTrail(pathname, title === "Wine Roam" ? undefined : title) : [];

  return (
    <>
      <header className="appbar">
        {back && (
          <button className="back tap" aria-label="Back" onClick={() => appBack(nav, pathname)}>
            ‹
          </button>
        )}
        {brand ? (
          <Link to="/home" aria-label="Home">
            <img src="/logo.svg" alt="Wine Roam" style={{ height: 30, display: "block" }} />
          </Link>
        ) : (
          <>
            {!back && (
              <Link to="/home" aria-label="Home" style={{ display: "flex" }}>
                <WineMark className="mark" />
              </Link>
            )}
            <h1>{title}</h1>
          </>
        )}
        {user && (
          <button className="appbar-signout tap" onClick={() => signOut()} aria-label="Sign out" title="Sign out">
            <PowerIcon />
          </button>
        )}
      </header>
      {crumbs.length > 1 && (
        <nav className="crumbs" aria-label="Breadcrumb">
          {crumbs.map((c) =>
            c.last ? (
              <span key={c.to} className="crumb cur" aria-current="page">{c.label}</span>
            ) : (
              <Fragment key={c.to}>
                <Link to={c.to} className="crumb tap">{c.label}</Link>
                <span className="crumb-sep">›</span>
              </Fragment>
            )
          )}
        </nav>
      )}
    </>
  );
}
