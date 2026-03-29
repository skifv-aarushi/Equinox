import './Speaker.css';

const SPEAKERS = [
    { name: 'Speaker Name', role: 'AI Researcher', org: 'Stellar Labs' },
    { name: 'Speaker Name', role: 'Blockchain Architect', org: 'Cosmos DAO' },
    { name: 'Speaker Name', role: 'CTO', org: 'NovaTech Industries' },
    { name: 'Speaker Name', role: 'Design Lead', org: 'Orbit Studios' },
];

export default function Speaker() {
    return (
        <section className="speakers section" id="speakers">
            {/* Background Star Cluster */}
            <div className="speakers__bg-vector">
                <svg viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="50" r="2" fill="var(--mist)" opacity="0.6" />
                    <circle cx="150" cy="120" r="3" fill="var(--gold-subtle)" opacity="0.4" />
                    <circle cx="220" cy="30" r="1.5" fill="var(--marble)" opacity="0.5" />
                    <circle cx="350" cy="150" r="4" fill="var(--mist)" opacity="0.3" />
                    <circle cx="480" cy="80" r="2.5" fill="var(--gold-subtle)" opacity="0.7" />
                    <circle cx="550" cy="160" r="2" fill="var(--marble)" opacity="0.5" />
                    <path d="M100 50 L150 120 L220 30" stroke="var(--gold-line)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.3" />
                    <path d="M350 150 L480 80 L550 160" stroke="var(--gold-line)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.3" />
                </svg>
            </div>

            <div className="section-title reveal">
                <h2>Speakers</h2>
                <p className="section-eyebrow">Guided by the brightest stars</p>
            </div>

            <div className="speakers__grid reveal stagger">
                {SPEAKERS.map((speaker, i) => (
                    <div className="speakers__card" key={i}>
                        <div className="speakers__avatar">
                            <div className="speakers__avatar-placeholder">
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                    <circle cx="20" cy="15" r="8" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                                    <path d="M6 36c0-8 6-14 14-14s14 6 14 14" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                                </svg>
                            </div>
                            <div className="speakers__avatar-ring" />
                        </div>
                        <h3 className="speakers__name">{speaker.name}</h3>
                        <span className="speakers__role accent-text">{speaker.role}</span>
                        <span className="speakers__org">{speaker.org}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
