import { useEffect, useRef, useState } from 'react';
import CelestialScene from '../three/CelestialScene';
import './Hero.css';

export default function Hero() {
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);

    // countdown state
    const [timeLeft, setTimeLeft] = useState({ d: 20, h: 0, m: 0, s: 0 });

    useEffect(() => {
        if (canvasRef.current && !sceneRef.current) {
            sceneRef.current = new CelestialScene(canvasRef.current);
        }

        // countdown logic (20 days from load)
        const target = new Date().getTime() + 20 * 24 * 60 * 60 * 1000;

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
                    A 48-Hour Hackathon by RoboVITics
                </p>

                <h1 className="hero__title" style={{alignItems:'center',justifyContent:'center',display:'flex'}}>
                    <span className="hero__title-equi">EQUI</span>
                    <span className="hero__title-nox">NOX</span>
                </h1>
                <h2 className="hero__title__h2" style={{alignItems:'center',justifyContent:'center',display:'flex'}}>
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
                    Where the balance of logic and creativity converges under the celestial dome of innovation.
                </p>

                <div className="hero__actions">
                    <button className="btn btn-primary" onClick={() => scrollTo('#register')}>
                        Register Now
                    </button>
                    <button className="btn" onClick={() => scrollTo('#tracks')}>
                        Explore Tracks
                    </button>
                </div>

                <div className="hero__scroll-indicator float">
                    <svg width="20" height="30" viewBox="0 0 20 30" fill="none">
                        <rect x="1" y="1" width="18" height="28" rx="9" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                        <circle className="hero__scroll-dot" cx="10" cy="10" r="2" fill="currentColor" opacity="0.5" />
                    </svg>
                </div>
            </div>
        </section>
    );
}