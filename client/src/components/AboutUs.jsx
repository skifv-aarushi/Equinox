import './AboutUs.css';

export default function AboutUs() {
    return (
        <section className="aboutus section" id="aboutus">

            {/* Background — two overlapping circles, duality motif */}
            <div className="aboutus__bg" aria-hidden="true">
                <svg viewBox="0 0 700 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="245" cy="250" r="210" stroke="var(--gold-line)" strokeWidth="0.8" strokeDasharray="3 7" opacity="0.45" />
                    <circle cx="455" cy="250" r="210" stroke="var(--gold-line)" strokeWidth="0.8" strokeDasharray="3 7" opacity="0.45" />
                    <circle cx="245" cy="250" r="140" stroke="var(--gold-line)" strokeWidth="0.5" opacity="0.25" />
                    <circle cx="455" cy="250" r="140" stroke="var(--gold-line)" strokeWidth="0.5" opacity="0.25" />
                    <circle cx="350" cy="250" r="5" fill="var(--gold-subtle)" opacity="0.7" />
                    <circle cx="350" cy="250" r="14" stroke="var(--gold-subtle)" strokeWidth="0.6" opacity="0.2" />
                    <line x1="350" y1="60" x2="350" y2="440" stroke="var(--gold-line)" strokeWidth="0.5" strokeDasharray="2 8" opacity="0.3" />
                    <line x1="90" y1="250" x2="610" y2="250" stroke="var(--gold-line)" strokeWidth="0.5" strokeDasharray="2 8" opacity="0.3" />
                </svg>
            </div>

            <div className="section-title reveal">
                <h2>About Us</h2>
                <p className="aboutus__intro accent-text">
                    The minds and institution behind Equinox
                </p>
            </div>

            <div className="aboutus__layout">

                {/* ── About VIT ── */}
                <article className="aboutus__card reveal slide-left">
                    <div className="aboutus__card-header">
                        <span className="aboutus__card-icon" aria-hidden="true">◎</span>
                        <h3 className="aboutus__card-title">About VIT</h3>
                    </div>

                    <p className="aboutus__card-tagline accent-text">
                        Shaping the engineers of tomorrow
                    </p>

                    <div className="aboutus__card-body">
                        <p>
                            Vellore Institute of Technology (VIT) is one of India's most
                            prestigious private technical universities, NAAC A++ accredited
                            and consistently top-ranked by NIRF with a global alumni
                            network spanning 125+ countries.
                        </p>
                        <p>
                            Founded in 1984, VIT's Vellore campus is home to Anna
                            Auditorium, the grand venue of Equinox '26, and over 40,000
                            students shaping the future across engineering, science,
                            and technology.
                        </p>
                    </div>

                    <div className="aboutus__card-stats">
                        <div className="aboutus__stat">
                            <span className="aboutus__stat-num">40+</span>
                            <span className="aboutus__stat-label">Years</span>
                        </div>
                        <div className="aboutus__stat">
                            <span className="aboutus__stat-num">A++</span>
                            <span className="aboutus__stat-label">NAAC Grade</span>
                        </div>
                        <div className="aboutus__stat">
                            <span className="aboutus__stat-num">125+</span>
                            <span className="aboutus__stat-label">Countries</span>
                        </div>
                    </div>
                </article>

                {/* ── Vertical Divider ── */}
                <div className="aboutus__divider reveal" aria-hidden="true">
                    <svg viewBox="0 0 40 360" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="divGold" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%"   stopColor="#C9A96E" stopOpacity="0" />
                                <stop offset="35%"  stopColor="#C9A96E" stopOpacity="0.35" />
                                <stop offset="65%"  stopColor="#C9A96E" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#C9A96E" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <line x1="20" y1="0" x2="20" y2="360" stroke="url(#divGold)" strokeWidth="1" />
                        <circle cx="20" cy="180" r="4"  fill="#C9A96E" opacity="0.65" />
                        <circle cx="20" cy="180" r="10" stroke="#C9A96E" strokeWidth="0.6" opacity="0.2" />
                    </svg>
                </div>

                {/* ── About RoboVITics ── */}
                <article className="aboutus__card reveal slide-right">
                    <div className="aboutus__card-header">
                        <span className="aboutus__card-icon" aria-hidden="true">⚙</span>
                        <h3 className="aboutus__card-title">About RoboVITics</h3>
                    </div>

                    <p className="aboutus__card-tagline accent-text">
                        Building the future, one circuit at a time
                    </p>

                    <div className="aboutus__card-body">
                        <p>
                            RoboVITics is the official Robotics Club of VIT Vellore. A
                            community of tech enthusiasts united by curiosity, ambition,
                            and hands-on innovation. Through workshops, seminars, and
                            ground-breaking projects, we mentor the next generation of
                            builders and roboticists.
                        </p>
                        <p>
                            <br></br>
                            Equinox is RoboVITics' flagship event, invites innovators nationwide to build the future of smart technology.
                        </p>
                    </div>

                    <div className="aboutus__card-stats">
                        <div className="aboutus__stat">
                            <span className="aboutus__stat-num">15+</span>
                            <span className="aboutus__stat-label">Years Active</span>
                        </div>
                        <div className="aboutus__stat">
                            <span className="aboutus__stat-num">500+</span>
                            <span className="aboutus__stat-label">Members</span>
                        </div>
                        <div className="aboutus__stat">
                            <span className="aboutus__stat-num">1500</span>
                            <span className="aboutus__stat-label">Participants</span>
                        </div>
                    </div>
                </article>

            </div>
        </section>
    );
}
