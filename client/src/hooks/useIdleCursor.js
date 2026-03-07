import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useIdleCursor
 * Returns `isIdle` — true after `delay` ms with no user activity.
 * Resets immediately on: mousemove, mousedown, scroll, keydown, contextmenu.
 */
export default function useIdleCursor(delay = 5000) {
    const [isIdle, setIsIdle] = useState(false);
    const timerRef = useRef(null);

    const reset = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        // Only trigger a state update if we were actually idle
        setIsIdle((prev) => {
            if (prev) return false;
            return prev;
        });
        timerRef.current = setTimeout(() => setIsIdle(true), delay);
    }, [delay]);

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'scroll', 'keydown', 'contextmenu'];

        events.forEach((ev) =>
            window.addEventListener(ev, reset, { passive: true })
        );

        // Start the initial timer
        timerRef.current = setTimeout(() => setIsIdle(true), delay);

        return () => {
            events.forEach((ev) => window.removeEventListener(ev, reset));
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [reset, delay]);

    return isIdle;
}
