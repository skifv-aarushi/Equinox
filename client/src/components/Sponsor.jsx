import { useEffect, useRef } from "react";
import './Sponsor.css';

const MAIN_SPONSOR = {
    name: 'Panasonic',
    logo: '/sponsor-logos/whiteanchor.svg',
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
                <h2>Our Sponsor</h2>
                <p className="section-eyebrow">Backed by industry leaders</p>
            </div>

            {/* Main sponsor — full-width centred row */}
            <div className="sponsor__main-row">
                <div className="sponsor__logo-card sponsor__logo-card--main">
                    <a
                        href="https://lsin.panasonic.com/switches-sockets"
                        aria-label="Visit Anchor by Panasonic"
                        className="sponsor__logo-link"
                    >
                        <img
                            src={MAIN_SPONSOR.logo}
                            alt={MAIN_SPONSOR.name}
                            className={`sponsor__logo-img${MAIN_SPONSOR.invert ? ' sponsor__logo-img--invert' : ''}`}
                            draggable={false}
                        />
                    </a>
                </div>
            </div>
        </section>
    );
}
