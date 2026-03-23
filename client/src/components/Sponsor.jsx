import { useEffect, useRef } from "react";
import './Sponsor.css';

const MAIN_SPONSOR = {
    name: 'Panasonic',
    logo: '/sponsor-logos/anchorpanasonic.svg',
    invert: false,   // black-on-white logo → invert for dark background
};

export default function Sponsor() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const cards = el.querySelectorAll(".sponsor__logo-card");

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    cards.forEach((card, index) => {
                        setTimeout(() => card.classList.add("show"), index * 100);
                    });
                }
            },
            { threshold: 0.2 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="sponsor section" id="sponsors">
            <div className="section-title reveal">
                <h2>Sponsors</h2>
                <p className="accent-text" style={{ textAlign: 'center', margin: '0 auto' }}>
                    The pillars that uphold the dome
                </p>
            </div>

            {/* Main sponsor — full-width centred row */}
            <div className="sponsor__main-row">
                <div className="sponsor__logo-card sponsor__logo-card--main">
                    <img
                        src={MAIN_SPONSOR.logo}
                        alt={MAIN_SPONSOR.name}
                        className={`sponsor__logo-img${MAIN_SPONSOR.invert ? ' sponsor__logo-img--invert' : ''}`}
                        draggable={false}
                    />
                </div>
            </div>
        </section>
    );
}
