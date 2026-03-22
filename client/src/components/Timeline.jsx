import { useEffect, useRef, useState } from "react";
import './Timeline.css';

const EVENTS = [
    /* ── Pre-event ── */
    { time: 'Before Hack', title: 'Online Screening (Review 0)', desc: 'Teams get shortlisted via Google Forms for on-site participation.', day: 'pre' },

    /* ── Day 1 — April 1, Wednesday ── */
    { time: '08:00 – 10:00 AM', title: 'Check-in & Registration', desc: 'Participants arrive at the venue.', day: '1' },
    { time: '10:00 – 11:00 AM', title: 'Inauguration', desc: 'Opening Ceremony and Welcome Address.', day: '1' },
    { time: '11:00 AM', title: 'Hack Commences', desc: '3 days of ideation, engineering, and innovation. The build phase begins.', day: '1' },
    { time: '05:30 – 07:30 PM', title: 'Review 1', desc: 'Progress evaluation; Teams get feedback on their work so far.', day: '1' },

    /* ── Day 2 — April 2, Thursday ── */
    { time: '10:00 AM – 12:00 PM', title: 'Review 2', desc: 'Judges assesses architecture, technical feasibility, and problem-solution fit.', day: '2' },
    { time: '05:00 – 06:00 PM', title: 'Speaker Session', desc: 'Industry expert shares perspectives on smart infrastructure and emerging tech.', day: '2' },

    /* ── Day 3 — April 3, Friday ── */
    { time: '10:00 AM – 12:00 PM', title: 'Review 3 & Code Freeze', desc: 'Submissions locked; judges shortlist the top teams for final stage.', day: '3' },
    { time: '02:15 – 06:00 PM', title: 'Final Pitches', desc: 'Finalists present and defend their solutions before the judging panel.', day: '3' },
    { time: '06:30 – 07:15 PM', title: 'Prize Distribution & Closing Ceremony', desc: 'Winners announced, prizes awarded, and Equinox \'26 concludes.', day: '3' },
];

const ICONS = {
    clipboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <rect x="9" y="2" width="6" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
    ),
    flag: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
    ),
    bolt: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    trophy: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <polyline points="8 21 12 21 16 21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <path d="M17 3H7l-.24 4.8A5 5 0 0 0 12 13a5 5 0 0 0 5.24-5.2L17 3z" />
            <path d="M4 5H7" />
            <path d="M20 5h-3" />
            <path d="M4 5a2 2 0 0 0 2 2" />
            <path d="M20 5a2 2 0 0 1-2 2" />
        </svg>
    ),
};

const DAY_GROUPS = [
    { label: 'Pre-event', date: 'Before Hack', icon: ICONS.clipboard, indices: [0] },
    { label: 'Day 1', date: 'April 1 · Wednesday', icon: ICONS.flag, indices: [1, 2, 3, 4] },
    { label: 'Day 2', date: 'April 2 · Thursday', icon: ICONS.bolt, indices: [5, 6] },
    { label: 'Day 3', date: 'April 3 · Friday', icon: ICONS.trophy, indices: [7, 8, 9] },
];

const FADE_MS = 380; // must match CSS transition duration

export default function Timeline() {
    const trackRef    = useRef(null);
    const stepperRef  = useRef(null);
    const expandedRef = useRef(null);
    const timerRef    = useRef(null);

    // isExpanded  — true means the full-timeline div is in-flow (height: auto)
    // stepperShow — true means stepper has opacity 1
    // expandShow  — true means expanded has opacity 1
    const [isExpanded,  setIsExpanded]  = useState(false);
    const [stepperShow, setStepperShow] = useState(true);
    const [expandShow,  setExpandShow]  = useState(false);

    /* ── Intersection observer — fires once expanded enters DOM ── */
    useEffect(() => {
        if (!isExpanded) return;
        const track = trackRef.current;
        if (!track) return;

        const raf = requestAnimationFrame(() => {
            const cards = track.querySelectorAll(".timeline__item:not(.show)");
            const obs = new IntersectionObserver(
                (entries) => entries.forEach(e => {
                    if (e.isIntersecting) { e.target.classList.add("show"); obs.unobserve(e.target); }
                }),
                { threshold: 0.15, rootMargin: "0px 0px -30px 0px" }
            );
            cards.forEach(c => obs.observe(c));
            track.classList.add("animate-line");
        });

        return () => cancelAnimationFrame(raf);
    }, [isExpanded]);

    const handleExpand = () => {
        clearTimeout(timerRef.current);

        // 1. Fade stepper out
        setStepperShow(false);

        timerRef.current = setTimeout(() => {
            // 2. Collapse stepper instantly, bring expanded into flow (opacity 0)
            setIsExpanded(true);

            // 3. Double rAF ensures browser has painted before we trigger fade-in
            requestAnimationFrame(() => requestAnimationFrame(() => {
                setExpandShow(true);
            }));
        }, FADE_MS);
    };

    const handleCollapse = () => {
        clearTimeout(timerRef.current);

        // 1. Fade expanded out + scroll section into view
        setExpandShow(false);
        document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        timerRef.current = setTimeout(() => {
            // 2. Remove expanded from flow, bring stepper back (opacity 0)
            setIsExpanded(false);

            // 3. Double rAF then fade stepper in
            requestAnimationFrame(() => requestAnimationFrame(() => {
                setStepperShow(true);
            }));
        }, FADE_MS);
    };

    /* Derive CSS class strings */
    const stepperClass = [
        'timeline__stepper',
        !stepperShow  ? 'timeline__stepper--faded' : '',
        isExpanded    ? 'timeline__stepper--gone'  : '',
    ].filter(Boolean).join(' ');

    const expandedClass = [
        'timeline__expanded',
        isExpanded   ? 'timeline__expanded--in-flow' : '',
        expandShow   ? 'timeline__expanded--shown'   : '',
    ].filter(Boolean).join(' ');

    return (
        <section className="timeline section" id="timeline">
            <div className="timeline__bg-vector">
                <svg viewBox="0 0 1000 1000" fill="none">
                    <ellipse cx="500" cy="500" rx="480" ry="120" transform="rotate(45 500 500)" stroke="var(--gold-line)" strokeWidth="0.5" strokeDasharray="5 5" opacity="0.3" />
                    <ellipse cx="500" cy="500" rx="480" ry="120" transform="rotate(-45 500 500)" stroke="var(--gold-line)" strokeWidth="0.5" opacity="0.2" />
                    <circle cx="500" cy="500" r="300" stroke="var(--gold-subtle)" strokeWidth="0.5" opacity="0.1" />
                </svg>
            </div>

            <div className="section-title">
                <h2>Timeline</h2>
                <p className="accent-text" style={{ textAlign: 'center', margin: '0 auto' }}>
                    The celestial schedule
                </p>
            </div>

            {/* ── Collapsed Stepper View ── */}
            <div ref={stepperRef} className={stepperClass}>
                <div className="timeline__stepper-line" />
                {DAY_GROUPS.map((group, gi) => (
                    <div className="timeline__step" key={gi}>
                        <div className="timeline__step-node">
                            <span className="timeline__step-icon">{group.icon}</span>
                        </div>
                        <div className="timeline__step-body">
                            <span className="timeline__step-label">{group.label}</span>
                            <span className="timeline__step-date">{group.date}</span>
                            <ul className="timeline__step-events">
                                {group.indices.map((idx) => (
                                    <li key={idx} className="timeline__step-event">
                                        <span className="timeline__step-dot" />
                                        <span className="timeline__step-event-name">{EVENTS[idx].title}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Expanded Full View ── */}
            <div ref={expandedRef} className={expandedClass}>
                <div ref={trackRef} className="timeline__track">
                    <div className="timeline__line" />
                    {EVENTS.map((event, i) => (
                        <div
                            className={`timeline__item ${i % 2 === 0 ? 'timeline__item--left' : 'timeline__item--right'}`}
                            key={i}
                        >
                            <div className="timeline__node">
                                <div className="timeline__node-ring" />
                            </div>
                            <div className="timeline__card">
                                <span className="timeline__time">{event.day !== 'pre' ? `Day ${event.day} · ` : ''}{event.time}</span>
                                <h3 className="timeline__event-title">{event.title}</h3>
                                <p className="timeline__event-desc">{event.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Toggle Button ── */}
            <div className="timeline__toggle-wrap">
                <button
                    className={`timeline__toggle-btn ${isExpanded ? 'timeline__toggle-btn--collapse' : ''}`}
                    onClick={isExpanded ? handleCollapse : handleExpand}
                    aria-expanded={isExpanded}
                >
                    <span>{isExpanded ? 'Collapse' : 'View Full Schedule'}</span>
                    <svg
                        className="timeline__toggle-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points={isExpanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
                    </svg>
                </button>
            </div>
        </section>
    );
}
