import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./GlobalEclipseOverlay.css";

gsap.registerPlugin(ScrollTrigger);

/*
 * GlobalEclipseOverlay — v3
 *
 * Matches the reference implementation:
 * ● Large moon (left, ~7 o'clock) and sun (right, ~4 o'clock) at #about
 * ● They arc upward along a clock-face path through #tracks / #timeline
 * ● Eclipse at 12 o'clock just before #sponsors
 * ● Brilliant corona glow + warm light cone at eclipse
 * ● Retreat & fade past sponsors
 *
 * Uses direct x/y position animation along a circular arc
 * rather than CSS transform-origin pendulum.
 */

/* ---- Arc geometry ----
 *
 * The arc center (pivot) is at viewport (50%, 85vh).
 * Radius ≈ 85vh so the top of the arc reaches y ≈ 0.
 *
 * Moon starts at angle -70° (≡ ~7 o'clock, lower-left)
 * Sun  starts at angle +70° (≡ ~5 o'clock, lower-right)
 * Both end at angle 0° (≡ 12 o'clock, top-center)
 *
 * x = cx + R·sin(θ)
 * y = cy - R·cos(θ)
 */

const DEG = Math.PI / 180;
const ARC_CX = 0.5;          // fraction of viewport width
const ARC_CY = 0.85;         // fraction of viewport height
const ARC_R_VH = 0.85;       // radius as fraction of viewport height

const MOON_START_ANGLE = -70; // degrees (left)
const SUN_START_ANGLE = 70; // degrees (right)
const ECLIPSE_ANGLE = 0; // degrees (top-center)

function arcPos(angleDeg, vw, vh) {
    const rad = angleDeg * DEG;
    const R = ARC_R_VH * vh;
    return {
        x: ARC_CX * vw + R * Math.sin(rad),
        y: ARC_CY * vh - R * Math.cos(rad),
    };
}

export default function GlobalEclipseOverlay() {
    const containerRef = useRef(null);
    const moonRef = useRef(null);
    const sunRef = useRef(null);
    const coronaRef = useRef(null);
    const coneRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        const moonEl = moonRef.current;
        const sunEl = sunRef.current;
        const coronaEl = coronaRef.current;
        const coneEl = coneRef.current;

        if (!container || !moonEl || !sunEl || !coronaEl || !coneEl) return;

        const rafId = requestAnimationFrame(() => {
            const aboutEl = document.getElementById("about");
            const sponsorsEl = document.getElementById("sponsors");
            const registerEl = document.getElementById("register");
            if (!aboutEl || !sponsorsEl || !registerEl) return;

            const vw = window.innerWidth;
            const vh = window.innerHeight;

            // Pre-calculate positions at key angles
            const moonStart = arcPos(MOON_START_ANGLE, vw, vh);
            const sunStart = arcPos(SUN_START_ANGLE, vw, vh);
            const eclipsePos = arcPos(ECLIPSE_ANGLE, vw, vh);

            const ctx = gsap.context(() => {

                // ── PHASE 1 — APPROACH  (About → Sponsors top) ──
                const approach = gsap.timeline({
                    scrollTrigger: {
                        trigger: aboutEl,
                        start: "top 80%",
                        endTrigger: sponsorsEl,
                        end: "top 55%",
                        scrub: 1,
                    },
                });

                // Moon: arc from lower-left to top-center
                approach.fromTo(moonEl,
                    { left: moonStart.x, top: moonStart.y, opacity: 0 },
                    {
                        left: eclipsePos.x, top: eclipsePos.y, opacity: 1,
                        ease: "power1.inOut", duration: 1
                    },
                    0
                );

                // Sun: arc from lower-right to top-center
                approach.fromTo(sunEl,
                    { left: sunStart.x, top: sunStart.y, opacity: 0 },
                    {
                        left: eclipsePos.x, top: eclipsePos.y, opacity: 1,
                        ease: "power1.inOut", duration: 1
                    },
                    0
                );

                // Corona: appears in the last 8%
                approach.fromTo(coronaEl,
                    { opacity: 0 },
                    { opacity: 1, ease: "power3.in", duration: 0.08 },
                    0.92
                );

                // Light cone: appears in the last 6%
                approach.fromTo(coneEl,
                    { opacity: 0 },
                    { opacity: 1, ease: "power2.in", duration: 0.06 },
                    0.94
                );

                // ── PHASE 2 — RETREAT  (Sponsors bottom → Register) ──
                const retreat = gsap.timeline({
                    scrollTrigger: {
                        trigger: sponsorsEl,
                        start: "bottom 60%",
                        endTrigger: registerEl,
                        end: "top 50%",
                        scrub: 1,
                    },
                });

                retreat.to(moonEl, {
                    left: moonStart.x, top: moonStart.y, opacity: 0,
                    ease: "power1.inOut", duration: 1
                }, 0);
                retreat.to(sunEl, {
                    left: sunStart.x, top: sunStart.y, opacity: 0,
                    ease: "power1.inOut", duration: 1
                }, 0);
                retreat.to(coronaEl, { opacity: 0, ease: "power2.out", duration: 0.3 }, 0);
                retreat.to(coneEl, { opacity: 0, ease: "power2.out", duration: 0.4 }, 0);

            }, container);

            container._gsapCtx = ctx;
        });

        return () => {
            cancelAnimationFrame(rafId);
            if (containerRef.current?._gsapCtx) {
                containerRef.current._gsapCtx.revert();
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="global-eclipse">
            {/* Moon — starts lower-left, arcs to noon */}
            <img
                ref={moonRef}
                src="/celestial/moon.svg"
                alt=""
                className="global-eclipse__moon"
                draggable={false}
                aria-hidden="true"
            />

            {/* Sun — starts lower-right, arcs to noon */}
            <img
                ref={sunRef}
                src="/celestial/sun.svg"
                alt=""
                className="global-eclipse__sun"
                draggable={false}
                aria-hidden="true"
            />

            {/* Corona glow — visible only at eclipse */}
            <div ref={coronaRef} className="global-eclipse__corona" />

            {/* Light cone — warm spotlight on sponsors */}
            <div ref={coneRef} className="global-eclipse__lightcone" />
        </div>
    );
}
