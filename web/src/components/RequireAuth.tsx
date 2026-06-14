import type { ReactElement } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { SkeletonList } from "./Skeleton";

// Route guard: requires a signed-in account to render `children`. An optional
// `allowGuest` escape hatch lets no-account guests through for specific routes
// (used by /bottle/:id, scoped to the bottles in their tasting). With `admin`,
// also requires Cognito admins-group membership; non-admins are bounced to /home
// so they never see the admin shell. Unauthenticated users go to the marketing
// page with a `next` so login returns them here.
export default function RequireAuth({
  children,
  allowGuest,
  admin,
}: {
  children: ReactElement;
  allowGuest?: (params: Record<string, string | undefined>) => boolean;
  admin?: boolean;
}) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const params = useParams();

  if (loading) {
    return (
      <div className="screen">
        <SkeletonList rows={5} />
      </div>
    );
  }

  if (admin) {
    if (!user) {
      const next = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/?next=${next}`} replace />;
    }
    return isAdmin ? children : <Navigate to="/home" replace />;
  }

  if (user) return children;
  if (allowGuest?.(params)) return children;

  const next = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/?next=${next}`} replace />;
}
