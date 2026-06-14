import { NavLink, Link } from "react-router-dom";
import { HomeIcon, BookIcon, GlassIcon, UsersIcon, UserIcon } from "../icons";
import { useAuth } from "../lib/auth";

// Desktop-only top navigation. The bottom tab bar is a mobile pattern; on wider
// screens this persistent header gives always-visible navigation on every page.
const items = [
  { to: "/home", label: "Home", Icon: HomeIcon },
  { to: "/learn", label: "Learn", Icon: BookIcon },
  { to: "/catalog", label: "Wines", Icon: GlassIcon },
  { to: "/tastings", label: "Tastings", Icon: UsersIcon },
  { to: "/profile", label: "Profile", Icon: UserIcon },
];

export default function TopNav() {
  const { user, signOut } = useAuth();
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <Link to="/home" className="topnav-brand" aria-label="Home">
          <img src="/logo.svg" alt="Wine Roam" />
        </Link>
        <div className="topnav-links">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `topnav-link${isActive ? " active" : ""}`}
            >
              <Icon className="ico" />
              <span>{label}</span>
            </NavLink>
          ))}
          {user && (
            <button className="topnav-link topnav-signout" onClick={() => signOut()}>
              Sign Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
