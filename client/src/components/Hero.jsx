import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for routing
import CelestialScene from '../three/CelestialScene';
import './Hero.css';

export default function Hero() {
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const navigate = useNavigate(); // Added for routing

    // countdown state
    const [timeLeft, setTimeLeft] = useState({ d: 20, h: 0, m: 0, s: 0 });

    useEffect(() => {
        if (canvasRef.current && !sceneRef.current) {
            sceneRef.current = new CelestialScene(canvasRef.current);
        }

        // countdown to April 1 2026 08:00 AM IST
        const target = new Date('2026-04-01T08:00:00+05:30').getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
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

    const scrollTo = (id) => {
        const el = document.querySelector(id);
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

                <h1 className="hero__title" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                    <span className="hero__title-equi">EQUI</span>
                    <span className="hero__title-nox">NOX</span>
                </h1>
                <h2 className="hero__title__h2" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                    <span className="hero__title-equi">20</span>
                    <span className="hero__title-nox">26</span>
                </h2>

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

                <p className="hero__subtitle">
                    Theme: Smart Infrastructure
                </p>

                <div className="hero__actions">
                    {/* Updated to use navigate('/register') instead of scrolling */}
                    <button className="btn btn-primary" onClick={() => navigate('/register')}>
                        Register Now
                    </button>
                    <button className="btn" onClick={() => scrollTo('#tracks')}>
                        Explore Tracks
                    </button>
                </div>

            </div>
        </section>
    );
}