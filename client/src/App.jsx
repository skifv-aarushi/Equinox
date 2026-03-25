import { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
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

// Sandbox testing imports
import Speaker from './components/Speaker';
import RegistrationHub from './components/RegistrationHub';
import TeamDashboard from './components/TeamDashboard';

import { TeamProvider } from './context/TeamContext';

// ─── Landing page (existing) ───────────────────────────────────────────────
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

// ─── Protected /register route ─────────────────────────────────────────────
function ProtectedRegister() {
  return (
    <>
      <SignedIn>
        <RegisterPage />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/register" />
      </SignedOut>
    </>
  );
}

// ─── Component Sandbox (/test) ─────────────────────────────────────────────
// Put whatever component you want to test inside this Sandbox!
function Sandbox() {
  return (
    <TeamProvider>
      <div className="app page-enter" style={{ minHeight: '100vh', padding: 'var(--nav-height) 20px 0', border: '2px dashed var(--gold-subtle)' }}>
        <div className="star-overlay" />
        <Navbar />
        <CustomCursor />
        <h1 className="accent-text" style={{ textAlign: 'center', margin: '2rem 0' }}>Sandbox Mode</h1>

        {/* ⬇️ DROP ANY COMPONENT HERE TO TEST IT ⬇️ */}
        <Speaker />
        {/* ⬆️------------------------------------⬆️ */}

      </div>
    </TeamProvider>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<ProtectedRegister />} />
      <Route path="/test" element={<Sandbox />} />
    </Routes>
  );
}
