import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SkeletonList } from "./components/Skeleton";
import { useEdgeSwipeBack } from "./lib/nav";
import { ensureBottles } from "./lib/bottleStore";
import { flush } from "./lib/offline";
import { track, pageKey } from "./lib/analytics";
import { useAuth } from "./lib/auth";
import { isGuestBottleAllowed } from "./lib/guestAccess";
import RequireAuth from "./components/RequireAuth";
import BottomNav from "./components/BottomNav";
import TopNav from "./components/TopNav";
import UpdatePrompt from "./components/UpdatePrompt";
import Onboarding from "./components/Onboarding";
import SyncBanner from "./components/SyncBanner";
import ChatWidget from "./components/ChatWidget";
import FeedbackPill from "./components/FeedbackPill";
// Landing + Home stay eager (first paint); everything else is route-split so
// the initial bundle (and the Amplify/Cognito-heavy account + admin code) loads
// on demand.
import Landing from "./pages/Landing";
import Home from "./pages/Home";

const Learn = lazy(() => import("./pages/Learn"));
const LearnArticle = lazy(() => import("./pages/LearnArticle"));
const Process = lazy(() => import("./pages/Process"));
const Wineries = lazy(() => import("./pages/Wineries"));
const WineryDetail = lazy(() => import("./pages/WineryDetail"));
const Catalog = lazy(() => import("./pages/Catalog"));
const BottleDetail = lazy(() => import("./pages/BottleDetail"));
const Scan = lazy(() => import("./pages/Scan"));
const Tastings = lazy(() => import("./pages/Tastings"));
const FlightBuilder = lazy(() => import("./pages/FlightBuilder"));
const FlightDetail = lazy(() => import("./pages/FlightDetail"));
const TastingSetup = lazy(() => import("./pages/TastingSetup"));
const TastingRunner = lazy(() => import("./pages/TastingRunner"));
const TastingQuiz = lazy(() => import("./pages/TastingQuiz"));
const TastingRecap = lazy(() => import("./pages/TastingRecap"));
const HostLive = lazy(() => import("./pages/HostLive"));
const JoinLive = lazy(() => import("./pages/JoinLive"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const SharedFlight = lazy(() => import("./pages/SharedFlight"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Responsible = lazy(() => import("./pages/Responsible"));
const Contact = lazy(() => import("./pages/Contact"));

// Bottom nav is hidden on the marketing landing and the guest-join flow.
const NO_NAV = [/^\/$/, /^\/join\//];

export default function App() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  // App chrome (tab bars, chat, onboarding) is for signed-in users only. Guests
  // in a tasting and logged-out visitors on the marketing page get just the
  // page's own AppBar — no links into account-gated routes.
  const showNav = !!user && !NO_NAV.some((re) => re.test(pathname));
  // Desktop top nav shows on every page except the guest-join flow (CSS hides it
  // under 721px, where the bottom tab bar takes over).
  const showTop = !!user && !/^\/join\//.test(pathname);
  useEdgeSwipeBack();
  useEffect(() => {
    ensureBottles();
    flush();
  }, []);
  // Anonymous page-view ping on each navigation (no path is stored server-side).
  useEffect(() => {
    track("page_view", pageKey(pathname));
  }, [pathname]);

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      {showTop && <TopNav />}
      <SyncBanner />
      <div id="main" tabIndex={-1}>
      <Suspense fallback={<div className="screen"><SkeletonList rows={5} /></div>}>
      <motion.div
        key={pathname}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        {/* Guest tasting flow — reachable by link/QR without an account */}
        <Route path="/taste/:id/setup" element={<TastingSetup />} />
        <Route path="/taste/:id" element={<TastingRunner />} />
        <Route path="/taste/:id/quiz" element={<TastingQuiz />} />
        <Route path="/taste/:id/recap" element={<TastingRecap />} />
        <Route path="/host/:sessionId" element={<HostLive />} />
        <Route path="/join/:code" element={<JoinLive />} />
        <Route path="/shared" element={<SharedFlight />} />
        {/* Public info pages (legal/about must be reachable signed-out) */}
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/responsible" element={<Responsible />} />
        <Route path="/contact" element={<Contact />} />
        {/* Bottle detail: signed-in users, or guests for bottles in their tasting */}
        <Route
          path="/bottle/:id"
          element={
            <RequireAuth allowGuest={(p) => isGuestBottleAllowed(p.id)}>
              <BottleDetail />
            </RequireAuth>
          }
        />
        {/* Account required */}
        <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/learn" element={<RequireAuth><Learn /></RequireAuth>} />
        <Route path="/learn/process" element={<RequireAuth><Process /></RequireAuth>} />
        <Route path="/learn/wineries" element={<RequireAuth><Wineries /></RequireAuth>} />
        <Route path="/winery/:id" element={<RequireAuth><WineryDetail /></RequireAuth>} />
        <Route path="/learn/:slug" element={<RequireAuth><LearnArticle /></RequireAuth>} />
        <Route path="/catalog" element={<RequireAuth><Catalog /></RequireAuth>} />
        <Route path="/scan" element={<RequireAuth><Scan /></RequireAuth>} />
        <Route path="/tastings" element={<RequireAuth><Tastings /></RequireAuth>} />
        <Route path="/tastings/build" element={<RequireAuth><FlightBuilder /></RequireAuth>} />
        <Route path="/flight/:id" element={<RequireAuth><FlightDetail /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </motion.div>
      </Suspense>
      </div>
      {showNav && <BottomNav />}
      {showNav && <ChatWidget />}
      {/* Feedback pill is available to everyone — signed in, guest, or logged out. */}
      <FeedbackPill />
      {showTop && pathname !== "/" && <Onboarding />}
      <UpdatePrompt />
    </div>
  );
}
