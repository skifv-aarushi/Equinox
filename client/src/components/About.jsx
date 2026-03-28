import { useRef, useEffect } from 'react';
import './About.css';

/* roboVITics — one entry per character in display order */
const CHARS = [
    { png: '/logo-chars/r.png', key: 'r0' },
    { png: '/logo-chars/o.png', key: 'o0' },
    { png: '/logo-chars/b.png', key: 'b' },
    { png: '/logo-chars/o.png', key: 'o1' },
    { png: '/logo-chars/V.png', key: 'V' },
    { png: '/logo-chars/I.png', key: 'I' },
    { png: '/logo-chars/T.png', key: 'T' },
    { png: '/logo-chars/small_i.png', key: 'i' },
    { png: '/logo-chars/c.png', key: 'c' },
    { png: '/logo-chars/s.png', key: 's' },
];

export default function About() {
    const sectionRef = useRef(null);
    const logoWrapRef = useRef(null);
    const imgRefs = useRef([]);
    const digitRefs = useRef([]);
    const timerRefs = useRef([]);
    const subRef = useRef(null);

    /* ── Entrance animation — fires when logo wrap itself scrolls into view ── */
    useEffect(() => {
        const target = logoWrapRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();

            CHARS.forEach((_, i) => {
                setTimeout(() => {
                    const img = imgRefs.current[i];
                    const digit = digitRefs.current[i];
                    if (!img || !digit) return;

                    /* show digit first */
                    digit.style.opacity = '1';
                    digit.textContent = Math.floor(Math.random() * 10).toString();

                    let ticks = 0;
                    const iv = setInterval(() => {
                        digit.textContent = Math.floor(Math.random() * 10).toString();
                        if (++ticks >= 7) {
                            clearInterval(iv);
                            digit.style.opacity = '0';
                            img.style.opacity = '1';

                            /* after the last char settles, fade in subscript */
                            if (i === CHARS.length - 1) {
                                setTimeout(() => {
                                    if (subRef.current) subRef.current.style.opacity = '1';
                                }, 200);
                            }
                        }
                    }, 60);
                }, i * 75);
            });
        }, { threshold: 0.5 });

        observer.observe(target);
        return () => observer.disconnect();
    }, []);

    /* ── Hover flicker ── */
    const startFlicker = (i) => {
        clearInterval(timerRefs.current[i]);
        const img = imgRefs.current[i];
        const digit = digitRefs.current[i];
        if (!img || !digit) return;

        img.style.opacity = '0';
        digit.style.opacity = '1';

        let ticks = 0;
        timerRefs.current[i] = setInterval(() => {
            digit.textContent = Math.floor(Math.random() * 10).toString();
            if (++ticks >= 8) clearInterval(timerRefs.current[i]);
        }, 60);
    };

    const stopFlicker = (i) => {
        clearInterval(timerRefs.current[i]);
        const img = imgRefs.current[i];
        const digit = digitRefs.current[i];
        if (!img || !digit) return;

        let ticks = 0;
        timerRefs.current[i] = setInterval(() => {
            digit.textContent = Math.floor(Math.random() * 10).toString();
            if (++ticks >= 4) {
                clearInterval(timerRefs.current[i]);
                img.style.opacity = '1';
                digit.style.opacity = '0';
            }
        }, 50);
    };

    return (
        <section ref={sectionRef} className="about section" id="about">
            {/* Background Astrolabe Vector */}
            <div className="about__bg-vector">
                <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="200" cy="200" r="180" stroke="var(--gold-line)" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                    <circle cx="200" cy="200" r="140" stroke="var(--gold-line)" strokeWidth="0.5" opacity="0.6" />
                    <circle cx="200" cy="200" r="100" stroke="var(--gold-subtle)" strokeWidth="1" opacity="0.3" />
                    <ellipse cx="200" cy="200" rx="180" ry="60" transform="rotate(30 200 200)" stroke="var(--gold-line)" strokeWidth="0.5" opacity="0.5" />
                    <ellipse cx="200" cy="200" rx="180" ry="60" transform="rotate(-30 200 200)" stroke="var(--gold-line)" strokeWidth="0.5" opacity="0.5" />
                    <path d="M200 20 L200 380 M20 200 L380 200" stroke="var(--gold-line)" strokeWidth="0.5" strokeDasharray="2 6" opacity="0.5" />
                    <circle cx="200" cy="200" r="4" fill="var(--gold-subtle)" opacity="0.8" />
                </svg>
            </div>

            <div className="section-title reveal">
                <h2>About Equinox</h2>
            </div>

           <div className="about__grid reveal">
                <div className="about__text">
                    <p className="about__lead accent-text">
                        Where innovation meets infrastructure
                    </p>
                     <ul>
                    <li>60 hours of non-stop innovation in Smart Infrastructure</li>
                    <li>Innovate for cities, homes, and connected ecosystems</li>
                    <li>Hosted by RoboVITics, VIT Vellore</li>
                    <li>A space for collaboration, creativity, and innovation</li>
                    <li>From idea to prototype in real-time</li>
                    <li>Where theory meets high-stakes problem solving</li>
                    </ul>
                </div>

                <div className="about__visual">
                    {/* PNG Character Logo */}
                    <div ref={logoWrapRef} className="about__logo-wrap">
                        <div className="about__logo-text">
                            {CHARS.map(({ png, key }, i) => (
                                <div
                                    key={key}
                                    className={`about__logo-char-wrap${i < 4 ? ' about__logo-char-wrap--robo' : ''}`}
                                    onMouseEnter={() => startFlicker(i)}
                                    onMouseLeave={() => stopFlicker(i)}
                                >
                                    <img
                                        ref={el => { imgRefs.current[i] = el; }}
                                        src={png}
                                        alt=""
                                        className="about__logo-char-img"
                                        style={{ opacity: 0 }}
                                        draggable={false}
                                    />
                                    <span
                                        ref={el => { digitRefs.current[i] = el; }}
                                        className="about__logo-char-digit"
                                        aria-hidden="true"
                                    >
                                        0
                                    </span>
                                </div>
                            ))}
                        </div>
                        <span
                            ref={subRef}
                            className="about__logo-sub"
                            style={{ opacity: 0 }}
                        >
                            The Official Robotics Club of VIT
                        </span>
                    </div>
                    {/* Equinox × Panasonic Logo */}
                    <div className="about__equinox-logo-wrap">
                        <img
                            src="/sponsor-logos/anchorequinox.svg"
                            alt="Equinox '26 × Panasonic"
                            className="about__equinox-logo"
                            draggable={false}
                        />
                    </div>
                    <div className="about__stats">
                        <div className="about__stat">
                            <span className="about__stat-number">60</span>
                            <span className="about__stat-label">Hours</span>
                        </div>
                        <div className="about__stat">
                            <span className="about__stat-number">6</span>
                            <span className="about__stat-label">Tracks</span>
                        </div>
                        <div className="about__stat">
                            <span className="about__stat-number">1500+</span>
                            <span className="about__stat-label">Participants</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}