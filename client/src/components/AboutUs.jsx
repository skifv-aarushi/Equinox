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
                            Vellore Institute of Technology (VIT) stands as one of India’s leading private technical universities, accredited with NAAC A++ and consistently ranked among the top institutions by NIRF. With a vibrant global alumni network spanning over 125 countries, VIT continues to shape innovators and leaders worldwide.
                        </p>
                        <p>
                            Established in 1984, the Vellore campus is a hub of excellence, hosting more than 40,000 students across diverse disciplines in engineering, science, and technology. It is also home to the iconic Anna Auditorium, the grand venue for Equinox ’26, where ideas, talent, and innovation converge.
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
                       Where Curiosity Meets Creation
                    </p>

                    <div className="aboutus__card-body">
                        <p>
                             <strong>RoboVITics</strong>, is the official Robotics Club of VIT Vellore, a community of tech enthusiasts united by curiosity, ambition, and a shared goal of learning and striving to be the best. We aim to pave the way for budding roboticists to build projects and discover their interests through hands-on workshops, seminars, and practical sessions. Together, we collaborate on ground-breaking projects, fostering innovation while building teams enriched with experience and achievements.
                        </p>
                        <p>
                            <br></br>
                          <strong>Equinox</strong>, our flagship event, invites innovators from across the nation to come together and shape the future of smart technology.
                        </p>
                    </div>

                    <div className="aboutus__card-stats">
                        <div className="aboutus__stat">
                            <span className="aboutus__stat-num">15+</span>
                            <span className="aboutus__stat-label">Years</span>
                        </div>
                        <div className="aboutus__stat">
                            <span className="aboutus__stat-num">500+</span>
                            <span className="aboutus__stat-label">Members</span>
                        </div>

                    </div>
                </article>

            </div>
        </section>
    );
}
