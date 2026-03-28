import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

// Landing-page sections
import RegisterCTA from './components/RegisterCTA';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import ConstellationCanvas from './components/ConstellationCanvas';
import GlobalEclipseOverlay from './components/GlobalEclipseOverlay';
import Hero from './components/Hero';
import About from './components/About';
import AboutUs from './components/AboutUs';
import Tracks from './components/Tracks';
import Timeline from './components/Timeline';
import Sponsor from './components/Sponsor';
import FAQ from './components/FAQ';
import RegisterForm from './components/RegisterForm';
import Footer from './components/Footer';

// Registration portal
import RegisterPage from './components/RegisterPage';
import SignInPage   from './components/SignInPage';
import SSOCallback  from './components/SSOCallback';

// Admin
import AdminPanel from './components/AdminPanel';

// Sandbox testing
import Speaker from './components/Speaker';

import { TeamProvider } from './context/TeamContext';

// ─── Landing page ──────────────────────────────────────────────────────────────
function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const els = document.querySelectorAll('.reveal');
    els.forEach((el) => observer.observe(el));
    return () => els.forEach((el) => observer.unobserve(el));
  }, []);

  return (
    <>
      <CustomCursor />
      <RegisterCTA />
      <Navbar />
      <ConstellationCanvas />
      <GlobalEclipseOverlay />

      <div className="app page-enter">
        <div className="star-overlay" />
        <Hero />
        <div className="celestial-divider" />
        <About />
        <div className="celestial-divider" />
        <Sponsor />
        <div className="celestial-divider" />
        <Timeline />
        <div className="celestial-divider" />
        <Tracks />
        <div className="celestial-divider" />
        <AboutUs />
        <div className="celestial-divider" />
        <RegisterForm />
        <div className="celestial-divider" />
        <FAQ />
        <Footer />
      </div>
    </>
  );
}

// ─── Protected /register ───────────────────────────────────────────────────────
function ProtectedRegister() {
  return (
    <>
      <SignedIn><RegisterPage /></SignedIn>
      <SignedOut><RedirectToSignIn redirectUrl="/register" /></SignedOut>
    </>
  );
}

// ─── Protected /admin ─────────────────────────────────────────────────────────
function ProtectedAdmin() {
  return (
    <>
      <SignedIn>
        <TeamProvider>
          <div className="app page-enter" style={{ minHeight: '100vh', padding: 'var(--nav-height) 20px 0' }}>
            <div className="star-overlay" />
            <Navbar />
            <CustomCursor />
            <AdminPanel />
          </div>
        </TeamProvider>
      </SignedIn>
      <SignedOut><RedirectToSignIn redirectUrl="/admin" /></SignedOut>
    </>
  );
}

// ─── Sandbox (/test) ──────────────────────────────────────────────────────────
function Sandbox() {
  return (
    <TeamProvider>
      <div className="app page-enter" style={{ minHeight: '100vh', padding: 'var(--nav-height) 20px 0', border: '2px dashed var(--gold-subtle)' }}>
        <div className="star-overlay" />
        <Navbar />
        <CustomCursor />
        <h1 className="accent-text" style={{ textAlign: 'center', margin: '2rem 0' }}>Sandbox Mode</h1>
        <Speaker />
      </div>
    </TeamProvider>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/"        element={<LandingPage />} />
      <Route path="/register"    element={<ProtectedRegister />} />
      <Route path="/sign-in"     element={<SignInPage />} />
      <Route path="/sso-callback" element={<SSOCallback />} />
      <Route path="/admin"       element={<ProtectedAdmin />} />
      <Route path="/test"    element={<Sandbox />} />
    </Routes>
  );
}
