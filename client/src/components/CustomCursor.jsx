import { useEffect, useRef } from 'react';
import './CustomCursor.css';

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

export default function CustomCursor() {
  if (isTouchDevice()) return null;

  const dotRef = useRef(null);
  const wrapperRef = useRef(null);
  const posRef = useRef({ x: -200, y: -200 });
  const ringPos = useRef({ x: -200, y: -200 });
  const rafRef = useRef(null);

  useEffect(() => {

    const onMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const loop = () => {
      const { x, y } = posRef.current;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${x - 4}px, ${y - 4}px)`;
      }

      // Ring follows with slight lag for smoothness
      ringPos.current.x += (x - ringPos.current.x) * 0.10;
      ringPos.current.y += (y - ringPos.current.y) * 0.10;

      if (wrapperRef.current) {
        wrapperRef.current.style.transform =
          `translate(${ringPos.current.x - 18}px, ${ringPos.current.y - 18}px)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Bright center dot */}
      <div className="cursor-dot" ref={dotRef} />

      {/* Rotating celestial ring wrapper (handles position) */}
      <div className="cursor-ring-wrapper" ref={wrapperRef}>
        {/* Inner div handles rotation only */}
        <div className="cursor-ring">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            {/* Outer orbit ring */}
            <circle
              cx="18" cy="18" r="15"
              stroke="rgba(201,169,110,0.55)"
              strokeWidth="0.8"
            />
            {/* Cardinal tick marks */}
            <line x1="18" y1="3" x2="18" y2="7.5" stroke="rgba(201,169,110,0.8)" strokeWidth="1.1" strokeLinecap="round" />
            <line x1="18" y1="28.5" x2="18" y2="33" stroke="rgba(201,169,110,0.8)" strokeWidth="1.1" strokeLinecap="round" />
            <line x1="3" y1="18" x2="7.5" y2="18" stroke="rgba(201,169,110,0.8)" strokeWidth="1.1" strokeLinecap="round" />
            <line x1="28.5" y1="18" x2="33" y2="18" stroke="rgba(201,169,110,0.8)" strokeWidth="1.1" strokeLinecap="round" />
            {/* Diagonal subtle marks */}
            <line x1="7.8" y1="7.8" x2="9.9" y2="9.9" stroke="rgba(201,169,110,0.35)" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="28.2" y1="7.8" x2="26.1" y2="9.9" stroke="rgba(201,169,110,0.35)" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="7.8" y1="28.2" x2="9.9" y2="26.1" stroke="rgba(201,169,110,0.35)" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="28.2" y1="28.2" x2="26.1" y2="26.1" stroke="rgba(201,169,110,0.35)" strokeWidth="0.7" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </>
  );
}
