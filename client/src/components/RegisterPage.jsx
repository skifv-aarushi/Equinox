/**
 * RegisterPage.jsx
 *
 * The dedicated /register route.
 * – Protected by Clerk (see App.jsx for <SignedIn>/<SignedOut> guards).
 * – Wraps content in <TeamProvider>.
 * – Conditionally renders RegistrationHub (no team) or TeamDashboard (has team).
 * – Includes the site's persistent chrome (Navbar, ConstellationCanvas, etc.)
 *   as standalone components so they work without the scroll-based App layout.
 */

import { Toaster } from 'react-hot-toast';
import { TeamProvider, useTeam } from '../context/TeamContext';
import RegistrationHub  from './RegistrationHub';
import TeamDashboard    from './TeamDashboard';
import Navbar           from './Navbar';
import ConstellationCanvas from './ConstellationCanvas';
import CustomCursor     from './CustomCursor';
import './RegisterPage.css';

// ─── Inner consumer (reads TeamContext) ──────────────────────────────────
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

// ─── RegisterPage ─────────────────────────────────────────────────────────
export default function RegisterPage() {
  return (
    <>
      <CustomCursor />
      <Navbar />
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

      <div className="rp-root">
        <div className="star-overlay" />

        <TeamProvider>
          <RegisterContent />
        </TeamProvider>
      </div>
    </>
  );
}
