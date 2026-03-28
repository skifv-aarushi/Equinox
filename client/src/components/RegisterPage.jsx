/**
 * RegisterPage.jsx
 *
 * The dedicated /register route.
 * – Protected by Clerk (see App.jsx for <SignedIn>/<SignedOut> guards).
 * – Wraps content in <TeamProvider>.
 * – Conditionally renders RegistrationHub (no team) or TeamDashboard (has team).
 * – RegisterNavbar is rendered inside TeamProvider so it can read team state
 *   and show a context-aware Submissions link.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { TeamProvider, useTeam } from '../context/TeamContext';
import RegistrationHub  from './RegistrationHub';
import TeamDashboard    from './TeamDashboard';
import ConstellationCanvas from './ConstellationCanvas';
import CustomCursor     from './CustomCursor';
import './RegisterPage.css';

// ─── Nav links (cross-page anchors) ──────────────────────────────────────────
const NAV_LINKS = [
  { label: 'About',    href: '/#about' },
  { label: 'Sponsors', href: '/#sponsors' },
  { label: 'Timeline', href: '/#timeline' },
  { label: 'Tracks',   href: '/#tracks' },
  { label: 'FAQ',      href: '/#faq' },
];

// Must be inside TeamProvider to access useTeam
function RegisterNavbar() {
  const { team } = useTeam();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSubmissions = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    if (team) {
      const el = document.getElementById('submissions');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="rh-nav">
      <div className="rh-nav__inner">
        <a href="/" className="rh-nav__logo">
          <img src="/equinox-logo.png" alt="" className="rh-nav__logo-icon" draggable={false} />
          <img src="/equinoxnav.png" alt="Equinox" className="rh-nav__logo-text" draggable={false} />
        </a>

        <button
          className={`rh-nav__toggle${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        <ul className={`rh-nav__links${menuOpen ? ' rh-nav__links--open' : ''}`}>
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <a href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            </li>
          ))}
          <li>
            <a href="#submissions" onClick={handleSubmissions}>
              Submissions
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

// ─── Inner consumer (reads TeamContext) ──────────────────────────────────────
function RegisterContent() {
  const { team, isLoading } = useTeam();

  if (isLoading) {
    return (
      <div className="rp-loading">
        <span className="rp-loading__ring" />
        <p>Fetching your team data…</p>
      </div>
    );
  }

  return team ? <TeamDashboard /> : <RegistrationHub />;
}

// ─── RegisterPage ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate   = useNavigate();
  const location   = useLocation();

  // Back-button fix: when arriving via Clerk auth redirect the browser history
  // may not have '/' before '/register'. We insert it so pressing back lands
  // on the landing page instead of Clerk's sign-in UI.
  useEffect(() => {
    if (!location.state?.backSetup) {
      const fromOurSite = document.referrer.startsWith(window.location.origin);
      if (!fromOurSite) {
        navigate('/', { replace: true });
        navigate('/register', { state: { backSetup: true } });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <CustomCursor />
      <ConstellationCanvas />

      {/* Toast portal — placed once, at the top level */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(15, 21, 35, 0.95)',
            color: '#F5F6F3',
            border: '1px solid rgba(201, 169, 110, 0.3)',
            backdropFilter: 'blur(16px)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.88rem',
            borderRadius: '10px',
            padding: '0.75rem 1.25rem',
          },
          success: {
            iconTheme: { primary: '#C9A96E', secondary: '#0F1523' },
          },
          error: {
            iconTheme: { primary: '#e57373', secondary: '#0F1523' },
          },
        }}
      />

      <TeamProvider>
        {/* Navbar lives inside TeamProvider so it can read team state */}
        <RegisterNavbar />
        <div className="rp-root">
          <div className="star-overlay" />
          <RegisterContent />
        </div>
      </TeamProvider>
    </>
  );
}
