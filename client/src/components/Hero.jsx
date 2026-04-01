import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { createApiClient, fetchTeamByEmail } from '../utils/api';
import CelestialScene from '../three/CelestialScene';
import './Hero.css';

export default function Hero() {
    const canvasRef = useRef(null);
    const sceneRef  = useRef(null);
    const navigate  = useNavigate();

    const { user, isLoaded: userLoaded } = useUser();
    const { getToken } = useAuth();

    // Will be null (no team), an object (has team), or 'loading'
    const [teamStatus, setTeamStatus] = useState('loading');

    // Countdown state
    const [timeLeft, setTimeLeft] = useState({ d: 20, h: 0, m: 0, s: 0 });

    // ── Fetch team status for logged-in user ──────────────────
    useEffect(() => {
        if (!userLoaded) return;

        if (!user) {
            // Not signed in
            setTeamStatus(null);
            return;
        }

        const email = user.primaryEmailAddress?.emailAddress;
        if (!email) { setTeamStatus(null); return; }

        const api = createApiClient(getToken);
        fetchTeamByEmail(api, email)
            .then(data => setTeamStatus(data ?? null))
            .catch(() => setTeamStatus(null));
    }, [userLoaded, user, getToken]);

    // ── Three.js canvas + countdown timer ────────────────────
    useEffect(() => {
        if (canvasRef.current && !sceneRef.current) {
            sceneRef.current = new CelestialScene(canvasRef.current);
        }

        // Countdown to April 7 2026 08:00 AM IST
        const target = new Date('2026-04-07T08:00:00+05:30').getTime();

        const timer = setInterval(() => {
            const now  = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) return clearInterval(timer);

            setTimeLeft({
                d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                h: Math.floor((diff / (1000 * 60 * 60)) % 24),
                m: Math.floor((diff / (1000 * 60)) % 60),
                s: Math.floor((diff / 1000) % 60)
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            if (sceneRef.current) {
                sceneRef.current.dispose();
                sceneRef.current = null;
            }
        };
    }, []);

    // ── Derived button labels ─────────────────────────────────
    const hasTeam    = teamStatus && teamStatus !== 'loading' && teamStatus.teamName;
    const primaryLabel = hasTeam ? 'View Team' : 'Register Now';

    const handlePrimary = () => navigate('/register');

    const handleExploreTracks = () => {
        const el = document.querySelector('#tracks');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="hero" id="hero">
            <div className="hero__canvas" ref={canvasRef} />
            <div className="hero__gradient-overlay" />

            <div className="hero__content page-enter">
                <p className="hero__pre-title accent-text">
                    A 60-Hour Hackathon by RoboVITics
                </p>

                <div className="hero__cobrand">
                    <img src="/sponsor-logos/whiteanchor.svg" alt="Anchor by Panasonic" className="hero__cobrand-logo" />
                    <p className="hero__powered-by hero__powered-by--after-logo">presents</p>
                </div>

                <h1 className="hero__title" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                    <span className="hero__title-equi">EQUI</span>
                    <span className="hero__title-nox">N</span>
                    <img src="/equinoxkaO.png" alt="O" className="hero__title-o" />
                    <span className="hero__title-nox">X</span>
                </h1>
                <h2 className="hero__title__h2" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                    <span className="hero__title-equi">20</span>
                    <span className="hero__title-nox">26</span>
                </h2>

                

                {/* HIGHLIGHTS (Priority 2) */}
                <div className="hero__highlights">
                    <span className="hero__highlight-item hero__highlight-gold" style={{ flex: 1, textAlign: 'right' }}>Prize Pool: ₹ 2,00,000+</span>
                    <span className="hero__highlight-divider">•</span>
                    <span className="hero__highlight-item" style={{ flex: 1, textAlign: 'left' }}>Theme: Smart Infrastructure</span>
                </div>

                {/* COUNTDOWN */}
                <div className="hero__countdown">
                    <div className="time-block">
                        <span>{timeLeft.d}</span>
                        <small>DAYS</small>
                    </div>
                    <div className="time-block">
                        <span>{timeLeft.h}</span>
                        <small>HRS</small>
                    </div>
                    <div className="time-block">
                        <span>{timeLeft.m}</span>
                        <small>MIN</small>
                    </div>
                    <div className="time-block">
                        <span>{timeLeft.s}</span>
                        <small>SEC</small>
                    </div>
                </div>

                

                <div className="hero__actions">
                    <button className="btn btn-primary" onClick={handlePrimary}>
                        {primaryLabel}
                    </button>
                    <button className="btn" onClick={handleExploreTracks}>
                        Explore Tracks
                    </button>
                </div>

            </div>
        </section>
    );
}