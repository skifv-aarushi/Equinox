import { useEffect, useRef } from 'react';
import './ConstellationCanvas.css';

/* ── Seeded LCG ── */
function seededRng(seed) {
    let s = (Math.abs(seed | 0) * 1664525 + 1013904223) | 0;
    return () => {
        s = (s * 1664525 + 1013904223) | 0;
        return (s >>> 0) / 4294967295;
    };
}

/* ── Background star field — seeded, consistent across renders ── */
function generateBgStars() {
    const rng = seededRng(53);
    return Array.from({ length: 320 }, () => {
        const bright  = rng();
        const palette = rng();
        const color =
            palette < 0.73 ? [245, 246, 243] :
            palette < 0.91 ? [180, 205, 255] :
                             [255, 235, 170];
        return {
            fx:      rng(),
            fy:      rng(),
            r:       0.22 + rng() * 1.3,
            alpha:   0.05 + bright * 0.28,
            color,
            twinkle: rng() > 0.55,
            period:  2800 + rng() * 5500,
            phase:   rng() * Math.PI * 2,
        };
    });
}

/* ══════════════════════════════════════════════════
   Constellation data.
   Each star position (fx, fy) is a full-viewport fraction (0–1).
   Stars span the whole screen — shapes are recognisable at scale.
   No lines — stars only.

   Color reflects real spectral class:
     O/B  [180, 210, 255]   blue-white
     A    [240, 244, 255]   white
     F/G  [255, 244, 210]   yellow-white
     K    [255, 210, 120]   orange
     M    [255, 145,  55]   red-orange
   ══════════════════════════════════════════════════ */
const CONSTELLATIONS = [

    /* 0 — ORION  (section: About) ────────────────────── */
    {
        stars: [
            /* Meissa      head      */ { fx: 0.48, fy: 0.07, r: 2.2, c: [220, 235, 255], a: 0.78 },
            /* Betelgeuse  L-shoulder*/ { fx: 0.11, fy: 0.27, r: 4.2, c: [255, 145,  55], a: 0.95 },
            /* Bellatrix   R-shoulder*/ { fx: 0.89, fy: 0.26, r: 2.8, c: [190, 215, 255], a: 0.85 },
            /* Alnitak     belt-L    */ { fx: 0.36, fy: 0.53, r: 2.5, c: [200, 220, 255], a: 0.82 },
            /* Alnilam     belt-C    */ { fx: 0.50, fy: 0.50, r: 2.8, c: [200, 220, 255], a: 0.85 },
            /* Mintaka     belt-R    */ { fx: 0.64, fy: 0.47, r: 2.2, c: [200, 220, 255], a: 0.78 },
            /* Saiph       L-foot    */ { fx: 0.19, fy: 0.88, r: 2.3, c: [190, 215, 255], a: 0.78 },
            /* Rigel       R-foot    */ { fx: 0.89, fy: 0.85, r: 4.5, c: [180, 210, 255], a: 0.96 },
        ],
    },

    /* 1 — LYRA  (section: Tracks) ────────────────────── */
    {
        stars: [
            /* Vega        apex      */ { fx: 0.50, fy: 0.07, r: 5.0, c: [210, 228, 255], a: 0.96 },
            /* Epsilon Lyr           */ { fx: 0.85, fy: 0.38, r: 1.8, c: [245, 246, 243], a: 0.70 },
            /* Zeta Lyr              */ { fx: 0.72, fy: 0.73, r: 2.0, c: [255, 244, 210], a: 0.73 },
            /* Delta Lyr             */ { fx: 0.28, fy: 0.73, r: 2.0, c: [255, 200, 100], a: 0.74 },
            /* Gamma Lyr             */ { fx: 0.15, fy: 0.38, r: 2.5, c: [255, 244, 210], a: 0.78 },
            /* Beta Lyr    base      */ { fx: 0.50, fy: 0.56, r: 2.5, c: [200, 220, 255], a: 0.80 },
        ],
    },

    /* 2 — URSA MAJOR / Big Dipper  (section: Timeline) ── */
    {
        stars: [
            /* Dubhe       bowl-tip  */ { fx: 0.05, fy: 0.19, r: 3.2, c: [255, 210, 120], a: 0.90 },
            /* Merak       bowl-bot  */ { fx: 0.22, fy: 0.37, r: 2.8, c: [245, 246, 243], a: 0.85 },
            /* Phecda      bowl-bot  */ { fx: 0.27, fy: 0.73, r: 2.5, c: [245, 246, 243], a: 0.80 },
            /* Megrez      bowl-tip  */ { fx: 0.07, fy: 0.71, r: 2.0, c: [245, 246, 243], a: 0.72 },
            /* Alioth      handle-1  */ { fx: 0.46, fy: 0.67, r: 3.2, c: [220, 235, 255], a: 0.88 },
            /* Mizar       handle-2  */ { fx: 0.67, fy: 0.43, r: 2.8, c: [200, 220, 255], a: 0.84 },
            /* Alkaid      handle-end*/ { fx: 0.89, fy: 0.10, r: 2.5, c: [190, 215, 255], a: 0.80 },
        ],
    },

    /* 3 — LEO  (section: Sponsors) ───────────────────── */
    {
        stars: [
            /* Regulus     heart     */ { fx: 0.58, fy: 0.92, r: 3.8, c: [200, 220, 255], a: 0.92 },
            /* Eta Leo               */ { fx: 0.48, fy: 0.70, r: 1.9, c: [255, 244, 210], a: 0.70 },
            /* Algieba     sickle    */ { fx: 0.27, fy: 0.50, r: 3.0, c: [255, 225, 140], a: 0.88 },
            /* Zeta Leo              */ { fx: 0.11, fy: 0.28, r: 1.9, c: [255, 244, 210], a: 0.72 },
            /* Mu Leo                */ { fx: 0.06, fy: 0.10, r: 1.8, c: [255, 210, 120], a: 0.70 },
            /* Epsilon Leo           */ { fx: 0.19, fy: 0.04, r: 2.2, c: [255, 225, 140], a: 0.75 },
            /* Lambda Leo            */ { fx: 0.36, fy: 0.16, r: 1.8, c: [255, 225, 140], a: 0.68 },
            /* Denebola    tail      */ { fx: 0.94, fy: 0.75, r: 3.0, c: [220, 235, 255], a: 0.86 },
            /* Theta Leo   back      */ { fx: 0.77, fy: 0.46, r: 2.2, c: [245, 246, 243], a: 0.76 },
        ],
    },

    /* 4 — CASSIOPEIA  (section: Register) ─────────────── */
    {
        stars: [
            /* Caph        W-start   */ { fx: 0.04, fy: 0.35, r: 2.5, c: [255, 244, 210], a: 0.82 },
            /* Schedar     W-low-1   */ { fx: 0.25, fy: 0.76, r: 3.2, c: [255, 205, 110], a: 0.90 },
            /* Gamma Cas   W-peak    */ { fx: 0.50, fy: 0.26, r: 3.0, c: [190, 215, 255], a: 0.88 },
            /* Ruchbah     W-low-2   */ { fx: 0.75, fy: 0.74, r: 2.5, c: [245, 246, 243], a: 0.80 },
            /* Segin       W-end     */ { fx: 0.96, fy: 0.30, r: 2.0, c: [200, 220, 255], a: 0.75 },
        ],
    },

    /* 5 — SCORPIUS  (section: FAQ) ────────────────────── */
    {
        stars: [
            /* Antares     heart     */ { fx: 0.38, fy: 0.11, r: 4.5, c: [255, 130,  55], a: 0.94 },
            /* Sigma Sco             */ { fx: 0.62, fy: 0.23, r: 2.0, c: [200, 220, 255], a: 0.75 },
            /* Tau Sco               */ { fx: 0.50, fy: 0.34, r: 2.0, c: [200, 220, 255], a: 0.74 },
            /* Pi Sco                */ { fx: 0.28, fy: 0.49, r: 1.9, c: [200, 220, 255], a: 0.70 },
            /* Rho Sco               */ { fx: 0.10, fy: 0.60, r: 1.8, c: [200, 220, 255], a: 0.68 },
            /* Nu Sco                */ { fx: 0.68, fy: 0.52, r: 1.8, c: [200, 220, 255], a: 0.68 },
            /* Graffias   claws      */ { fx: 0.55, fy: 0.67, r: 2.3, c: [200, 220, 255], a: 0.78 },
            /* Dschubba              */ { fx: 0.42, fy: 0.79, r: 2.3, c: [200, 220, 255], a: 0.76 },
            /* Lambda Sco  stinger   */ { fx: 0.30, fy: 0.92, r: 2.0, c: [200, 220, 255], a: 0.70 },
        ],
    },

    /* 6 — PERSEUS  (section: Hero) ─────────────────────── */
    {
        stars: [
            /* Mirfak      body-core */ { fx: 0.52, fy: 0.33, r: 4.0, c: [255, 244, 210], a: 0.94 },
            /* Algol       demon-head*/ { fx: 0.82, fy: 0.62, r: 3.2, c: [200, 220, 255], a: 0.90 },
            /* Delta Per   shoulder  */ { fx: 0.60, fy: 0.18, r: 2.8, c: [190, 215, 255], a: 0.84 },
            /* Eta Per     sword-arm */ { fx: 0.44, fy: 0.10, r: 2.5, c: [255, 200, 100], a: 0.80 },
            /* Tau Per     sword-tip */ { fx: 0.26, fy: 0.14, r: 2.0, c: [255, 210, 120], a: 0.74 },
            /* Phi Per     R-wing    */ { fx: 0.88, fy: 0.36, r: 1.9, c: [190, 215, 255], a: 0.72 },
            /* Epsilon Per arm       */ { fx: 0.76, fy: 0.46, r: 2.2, c: [180, 210, 255], a: 0.78 },
            /* Zeta Per    L-leg     */ { fx: 0.66, fy: 0.78, r: 2.5, c: [190, 215, 255], a: 0.80 },
            /* Gamma Per   L-side    */ { fx: 0.34, fy: 0.46, r: 2.2, c: [255, 220, 140], a: 0.76 },
            /* Iota Per    far-left  */ { fx: 0.16, fy: 0.56, r: 1.9, c: [255, 244, 210], a: 0.68 },
        ],
    },

    /* 7 — GEMINI  (section: AboutUs) ──────────────────── */
    {
        stars: [
            /* Castor      L-twin    */ { fx: 0.34, fy: 0.07, r: 3.5, c: [220, 235, 255], a: 0.92 },
            /* Pollux      R-twin    */ { fx: 0.66, fy: 0.09, r: 4.2, c: [255, 210, 120], a: 0.96 },
            /* Mebsuda (ε) L-body    */ { fx: 0.27, fy: 0.32, r: 2.3, c: [255, 244, 210], a: 0.80 },
            /* Alhena (γ)  R-body    */ { fx: 0.74, fy: 0.36, r: 2.8, c: [240, 244, 255], a: 0.84 },
            /* Wasat  (δ)  centre    */ { fx: 0.52, fy: 0.38, r: 2.0, c: [255, 244, 210], a: 0.74 },
            /* Nu Gem      L-leg-up  */ { fx: 0.18, fy: 0.54, r: 2.0, c: [200, 220, 255], a: 0.72 },
            /* Lambda Gem  R-leg-mid */ { fx: 0.64, fy: 0.60, r: 1.9, c: [240, 244, 255], a: 0.70 },
            /* Mu Gem      L-foot    */ { fx: 0.10, fy: 0.74, r: 2.3, c: [255, 145,  55], a: 0.80 },
            /* Mekbuda (ζ) R-foot    */ { fx: 0.60, fy: 0.82, r: 2.2, c: [255, 244, 210], a: 0.76 },
            /* Eta Gem     far-L-ft  */ { fx: 0.06, fy: 0.90, r: 2.0, c: [255, 145,  55], a: 0.72 },
            /* Kappa Gem   R-lower   */ { fx: 0.76, fy: 0.74, r: 1.9, c: [255, 220, 140], a: 0.68 },
        ],
    },
];

/* Section id → constellation index */
const SECTION_MAP = [
    { id: 'hero',     idx: 6 },  // Perseus
    { id: 'about',    idx: 0 },  // Orion
    { id: 'aboutus',  idx: 7 },  // Gemini
    { id: 'tracks',   idx: 1 },  // Lyra
    { id: 'timeline', idx: 2 },  // Ursa Major
    { id: 'sponsors', idx: 3 },  // Leo
    { id: 'register', idx: 4 },  // Cassiopeia
    { id: 'faq',      idx: 5 },  // Scorpius
];

const BG_STARS = generateBgStars();

/* ══════════════════════════════════════════════════
   ConstellationCanvas
   ══════════════════════════════════════════════════ */
export default function ConstellationCanvas() {
    const canvasRef   = useRef(null);
    const targetRef   = useRef(-1);   // which constellation to show (-1 = none)
    const displayRef  = useRef({ idx: -1, alpha: 0 }); // current draw state

    /* ── Section visibility tracking ── */
    useEffect(() => {
        const ratios = {};

        const pick = () => {
            let best = -1, bestR = 0;
            for (const { id, idx } of SECTION_MAP) {
                const r = ratios[id] || 0;
                if (r > bestR) { bestR = r; best = idx; }
            }
            targetRef.current = bestR > 0.12 ? best : -1;
        };

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => { ratios[e.target.id] = e.intersectionRatio; });
                pick();
            },
            { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] }
        );

        SECTION_MAP.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) obs.observe(el);
        });

        return () => obs.disconnect();
    }, []);

    /* ── Draw loop ── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        let rafId, W, H;

        const resize = () => {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };

        const FADE_SPEED = 0.022; // ~45 frames per transition

        /* Central 40 % bounding box — constellation coords (0–1) map into this */
        const CX0 = 0.30, CX1 = 0.70;  // 30 %–70 % of viewport width
        const CY0 = 0.30, CY1 = 0.70;  // 30 %–70 % of viewport height

        const draw = (ts) => {
            ctx.clearRect(0, 0, W, H);

            const disp   = displayRef.current;
            const target = targetRef.current;

            /* Fade logic — fade out then switch then fade in */
            if (disp.idx !== target) {
                disp.alpha -= FADE_SPEED;
                if (disp.alpha <= 0) {
                    disp.alpha = 0;
                    disp.idx   = target;
                }
            } else if (target >= 0) {
                disp.alpha = Math.min(1, disp.alpha + FADE_SPEED);
            }

            const masterAlpha = disp.alpha;

            /* ── Background stars (always drawn, very faint) ── */
            for (const s of BG_STARS) {
                let a = s.alpha;
                if (s.twinkle) {
                    const t = ts / s.period;
                    a *= 0.30 + 0.70 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 + s.phase));
                }
                const [r, g, b] = s.color;
                ctx.beginPath();
                ctx.arc(s.fx * W, s.fy * H, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
                ctx.fill();
            }

            /* ── Active constellation stars ── */
            if (masterAlpha > 0 && disp.idx >= 0) {
                const con = CONSTELLATIONS[disp.idx];

                for (const s of con.stars) {
                    const x = (CX0 + s.fx * (CX1 - CX0)) * W;
                    const y = (CY0 + s.fy * (CY1 - CY0)) * H;

                    /* Slow individual shimmer */
                    const flicker = 0.80 + 0.20 * (0.5 + 0.5 *
                        Math.sin((ts / (3800 + s.fx * 1600)) * Math.PI * 2 + s.fx * 8.1));
                    const a = s.a * flicker * masterAlpha;
                    const [r, g, b] = s.c;

                    /* Core disc */
                    ctx.beginPath();
                    ctx.arc(x, y, s.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
                    ctx.fill();
                }
            }

            rafId = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener('resize', resize);
        rafId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="constellation-canvas" aria-hidden="true" />;
}
