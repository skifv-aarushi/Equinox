import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./GlobalEclipseOverlay.css";

gsap.registerPlugin(ScrollTrigger);

/*
 * GlobalEclipseOverlay — v5
 *
 * Key fix: Corona and lightcone opacity are driven by the ANGLE
 * convergence of the sun and moon, not by fixed scroll percentages.
 * This ensures the halo ONLY appears when the bodies actually meet.
 *
 * ● Moon (left, ~8 o'clock) and Sun (right, ~4 o'clock) start separated
 * ● True circular arc motion via angle-based proxy animation
 * ● Corona + lightcone ONLY appear when angles are within ~8° of each other
 * ● Eclipse + spotlight illuminates down to the Panasonic logo bottom
 * ● Sun and moon part as the scroll reaches the top of Panasonic
 * ● Everything (corona, cone, bodies) fully gone before Timeline section
 */

const DEG = Math.PI / 180;

const ARC_CX = 0.5;
const ARC_CY = 1.0;
const ARC_R_VH = 1.0;

const MOON_START_ANGLE = -80;
const SUN_START_ANGLE  =  80;
const ECLIPSE_ANGLE    =   0;

const MOON_SIZE = 130;
const SUN_SIZE  = 110;

// Corona/cone only visible when both bodies are within this many degrees of eclipse point
const CORONA_THRESHOLD_DEG = 12;

function arcXY(angleDeg, vw, vh) {
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
            if (!aboutEl || !sponsorsEl) return;

            const vw = window.innerWidth;
            const vh = window.innerHeight;

            const moonProxy = { angle: MOON_START_ANGLE, opacity: 0 };
            const sunProxy  = { angle: SUN_START_ANGLE, opacity: 0 };

            function updatePositions() {
                // Update moon position
                const moonPos = arcXY(moonProxy.angle, vw, vh);
                moonEl.style.left = (moonPos.x - MOON_SIZE / 2) + 'px';
                moonEl.style.top  = (moonPos.y - MOON_SIZE / 2) + 'px';
                moonEl.style.opacity = moonProxy.opacity;

                // Update sun position
                const sunPos = arcXY(sunProxy.angle, vw, vh);
                sunEl.style.left = (sunPos.x - SUN_SIZE / 2) + 'px';
                sunEl.style.top  = (sunPos.y - SUN_SIZE / 2) + 'px';
                sunEl.style.opacity = sunProxy.opacity;

                // ── KEY FIX: Drive corona/cone from angular proximity ──
                // Only show halo when both bodies are near the eclipse point
                const moonDist = Math.abs(moonProxy.angle - ECLIPSE_ANGLE);
                const sunDist  = Math.abs(sunProxy.angle - ECLIPSE_ANGLE);
                const maxDist  = Math.max(moonDist, sunDist);

                // Both must be visible for the halo to show
                const bodiesVisible = Math.min(moonProxy.opacity, sunProxy.opacity);

                let haloOpacity = 0;
                if (maxDist < CORONA_THRESHOLD_DEG && bodiesVisible > 0.3) {
                    // Ramp from 0 at threshold to 1 at 0 degrees
                    haloOpacity = Math.pow(1 - (maxDist / CORONA_THRESHOLD_DEG), 2) * bodiesVisible;
                }

                coronaEl.style.opacity = haloOpacity;
                coneEl.style.opacity = haloOpacity * 0.9; // cone slightly less intense
            }

            // Set initial positions (hidden)
            updatePositions();

            const ctx = gsap.context(() => {

                // ── PHASE 1 — APPROACH (About section → Sponsors title area) ──
                const approach = gsap.timeline({
                    scrollTrigger: {
                        trigger: aboutEl,
                        start: "top 60%",
                        endTrigger: sponsorsEl,
                        end: "top 20%",
                        scrub: 1.2,
                    },
                });

                // Moon: arc from -80° to 0°
                approach.to(moonProxy, {
                    angle: ECLIPSE_ANGLE,
                    opacity: 1,
                    ease: "power2.inOut",
                    duration: 1,
                    onUpdate: updatePositions,
                }, 0);

                // Sun: arc from +80° to 0°
                approach.to(sunProxy, {
                    angle: ECLIPSE_ANGLE,
                    opacity: 1,
                    ease: "power2.inOut",
                    duration: 1,
                    onUpdate: updatePositions,
                }, 0);

                // ── PHASE 2 — RETREAT (starts when Panasonic is in view) ──
                // Sun and moon part as scroll reaches the Panasonic card area
                // Everything FULLY gone before sponsor section bottom
                const retreat = gsap.timeline({
                    scrollTrigger: {
                        trigger: sponsorsEl,
                        start: "top 10%",    // when sponsors title reaches near top
                        end: "bottom 60%",    // done well before sponsors section ends
                        scrub: 1,
                    },
                });

                // Moon returns to a moderate angle
                retreat.to(moonProxy, {
                    angle: -45,
                    opacity: 0,
                    ease: "power1.inOut",
                    duration: 1,
                    onUpdate: updatePositions,
                }, 0);

                // Sun returns to a moderate angle
                retreat.to(sunProxy, {
                    angle: 45,
                    opacity: 0,
                    ease: "power1.inOut",
                    duration: 1,
                    onUpdate: updatePositions,
                }, 0);

                // Corona and cone opacity handled by updatePositions automatically
                // But force them to 0 at end as a safety net
                retreat.set(coronaEl, { opacity: 0 }, 1);
                retreat.set(coneEl, { opacity: 0 }, 1);

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
            <img
                ref={moonRef}
                src="/celestial/moon.svg"
                alt=""
                className="global-eclipse__moon"
                draggable={false}
                aria-hidden="true"
            />
            <img
                ref={sunRef}
                src="/celestial/sun.svg"
                alt=""
                className="global-eclipse__sun"
                draggable={false}
                aria-hidden="true"
            />
            <div ref={coronaRef} className="global-eclipse__corona" />
            <div ref={coneRef} className="global-eclipse__lightcone" />
        </div>
    );
}
