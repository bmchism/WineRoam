import { NavLink } from "react-router-dom";
import { HomeIcon, BookIcon, GlassIcon, UsersIcon, UserIcon } from "../icons";

const items = [
  { to: "/home", label: "Home", Icon: HomeIcon },
  { to: "/learn", label: "Learn", Icon: BookIcon },
  { to: "/catalog", label: "Wines", Icon: GlassIcon },
  { to: "/tastings", label: "Tastings", Icon: UsersIcon },
  { to: "/profile", label: "Profile", Icon: UserIcon },
];

export default function BottomNav() {
  return (
    <nav className="bottomnav">
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          {({ isActive }) => (
            <>
              <Icon className={`ico${isActive ? " active" : ""}`} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
