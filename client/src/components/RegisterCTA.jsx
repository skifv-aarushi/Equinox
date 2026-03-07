import { useState, useEffect, useRef, useCallback } from 'react';
import './RegisterCTA.css';

/**
 * RegisterCTA — 3-state context-aware Register button
 *
 * States:
 *  'corner'  — pill fixed bottom-left, user is active
 *  'cursor'  — pill follows the cursor after 5 s of inactivity
 *  'hidden'  — #register section is in the viewport
 *
 * Animation sequence (corner → cursor):
 *  1. Corner pill dissolves (scale 0, opacity 0) over 300 ms
 *  2. Cursor pill is already at the cursor position (tracked via RAF)
 *  3. Cursor pill re-materializes (scale 1, opacity 1) with a 300 ms
 *     transition-delay, starting only after the corner has collapsed.
 *
 * Click fix:
 *  onMouseDown + e.stopPropagation() ensures the click fires before the
 *  global mousedown listener can strip pointer-events from the button.
 */
export default function RegisterCTA() {
    const [ctaMode, setCtaMode] = useState('corner'); // 'corner' | 'cursor' | 'hidden'

    // Mirrors ctaMode synchronously for the RAF closure (avoids stale closure capture)
    const ctaModeRef = useRef('corner');

    const cursorBtnRef = useRef(null);
    const posRef = useRef({ x: -200, y: -200 });
    const idleTimerRef = useRef(null);
    const registerVisible = useRef(false);
    const rafRef = useRef(null);

    // Wrapper so ctaModeRef always stays in sync with state
    const setCta = useCallback((mode) => {
        ctaModeRef.current = mode;
        // Snap cursor pill to current mouse position the instant we enter cursor mode.
        // This guarantees it re-materialises exactly at the cursor after the 300 ms delay.
        if (mode === 'cursor' && cursorBtnRef.current) {
            const { x, y } = posRef.current;
            cursorBtnRef.current.style.transform =
                `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
        }
        setCtaMode(mode);
    }, []);

    /* ── Scroll to #register — left-click only ── */
    const goToRegister = useCallback((e) => {
        // Only react to left mouse button (button 0)
        if (e.button !== 0) return;
        // Stop the global mousedown listener from firing (would strip pointer-events)
        e.stopPropagation();
        document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    /* ── Idle scheduling ── */
    const scheduleIdle = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            if (!registerVisible.current) setCta('cursor');
        }, 5000);
    }, [setCta]);

    /* ── Activity reset (does NOT fire when clicking the CTA button itself) ── */
    const onActivity = useCallback(() => {
        if (registerVisible.current) return;
        setCta('corner');
        scheduleIdle();
    }, [setCta, scheduleIdle]);

    /* ── Main effect ── */
    useEffect(() => {
        if (window.matchMedia('(pointer: coarse)').matches) return;

        /* RAF cursor-tracking — only move the pill while it is in cursor mode.
           When reverting to corner, the pill freezes in-place and dissolves cleanly. */
        const tick = () => {
            if (ctaModeRef.current === 'cursor' && cursorBtnRef.current) {
                const { x, y } = posRef.current;
                cursorBtnRef.current.style.transform =
                    `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        /* Global activity listeners */
        const onMove = (e) => {
            posRef.current = { x: e.clientX, y: e.clientY };
            onActivity();
        };
        const onMisc = () => onActivity();

        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('mousedown', onMisc, { passive: true });
        window.addEventListener('scroll', onMisc, { passive: true });
        window.addEventListener('keydown', onMisc, { passive: true });

        /* IntersectionObserver — hide while #register is on-screen */
        const registerEl = document.getElementById('register');
        let observer = null;
        if (registerEl) {
            observer = new IntersectionObserver(
                ([entry]) => {
                    registerVisible.current = entry.isIntersecting;
                    if (entry.isIntersecting) {
                        setCta('hidden');
                        clearTimeout(idleTimerRef.current);
                    } else {
                        onActivity();
                    }
                },
                { threshold: 0.15 }
            );
            observer.observe(registerEl);
        }

        /* Start idle countdown immediately on mount */
        scheduleIdle();

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mousedown', onMisc);
            window.removeEventListener('scroll', onMisc);
            window.removeEventListener('keydown', onMisc);
            observer?.disconnect();
            cancelAnimationFrame(rafRef.current);
            clearTimeout(idleTimerRef.current);
        };
    }, [onActivity, scheduleIdle]);

    /* Touch devices — render nothing */
    if (typeof window !== 'undefined' &&
        window.matchMedia('(pointer: coarse)').matches) return null;

    const cornerVisible = ctaMode === 'corner';
    const cursorVisible = ctaMode === 'cursor';

    return (
        <>
            {/* ── Corner pill — bottom-left fixed ── */}
            <button
                className={`rcta rcta-corner${cornerVisible ? ' rcta--visible' : ''}`}
                onMouseDown={goToRegister}
                aria-label="Scroll to registration form"
                tabIndex={cornerVisible ? 0 : -1}
            >
                <span className="rcta__label">Register</span>
                <span className="rcta__star" aria-hidden="true">✦</span>
            </button>

            {/* ── Cursor pill — follows mouse via RAF ──
          transition-delay keeps it invisible while the corner dissolves,
          then it re-materialises in-place at the cursor position.         */}
            <button
                ref={cursorBtnRef}
                className={`rcta rcta-cursor${cursorVisible ? ' rcta--visible' : ''}`}
                onMouseDown={goToRegister}
                aria-label="Scroll to registration form"
                tabIndex={cursorVisible ? 0 : -1}
            >
                <span className="rcta__label">Register</span>
                <span className="rcta__star" aria-hidden="true">✦</span>
            </button>
        </>
    );
}
