import React, { useEffect, useRef } from 'react';

const smoothstep = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - (1 - t) ** 2;
const easeIn = (t) => t * t;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Cargando Banco de Bogotá: overlay a pantalla completa sobre la vista actual.
 * @param {boolean} [isOpen] — controla visibilidad (mismo patrón que Davivienda, Occidente, etc.)
 */
export default function LoadingBogota({ isOpen = true }) {
    const ballsRef = useRef({ blue: null, red: null, yellow: null });
    const shadowRef = useRef(null);
    const requestRef = useRef();
    const startRef = useRef();

    const config = {
        loop: 5760,
        ballSize: 36,
        peakHeight: 76,
        soloBounceMs: 700,
        yellowRiseMs: 720,
        yellowJoinMs: 580,
        trioRiseMs: 920,
        spinMs: 1720,
        collapseMs: 420,
        spinRotations: 2,
        laneSpread: 30,
        clusterRadius: 26,

        ballsTextGap: 28,
        ballOffsetY: 0,
    };

    const phases = [
        { key: 'red', duration: config.soloBounceMs },
        { key: 'blue', duration: config.soloBounceMs },
        {
            key: 'yellow',
            duration: config.yellowRiseMs + config.yellowJoinMs,
        },
        { key: 'trioRise', duration: config.trioRiseMs },
        { key: 'spin', duration: config.spinMs },
        { key: 'collapse', duration: config.collapseMs },
    ];

    const phaseAt = (elapsed) => {
        let t = 0;
        for (let i = 0; i < phases.length; i += 1) {
            const next = t + phases[i].duration;
            if (elapsed < next) {
                return {
                    key: phases[i].key,
                    local: elapsed - t,
                    duration: phases[i].duration,
                };
            }
            t = next;
        }
        return { key: 'red', local: 0, duration: config.soloBounceMs };
    };

    const setBall = (el, { x = 0, y = 0, scale = 1, opacity = 1 }) => {
        if (!el) return;
        el.style.opacity = String(opacity);
        el.style.transform = `translate(-50%, ${-Math.round(y)}px) translate(${Math.round(x)}px, 0) scale(${scale})`;
    };

    const setShadow = (liftRatio) => {
        if (!shadowRef.current) return;
        shadowRef.current.style.transform = `translateX(-50%) scale(${1 - liftRatio * 0.38})`;
        shadowRef.current.style.opacity = String(0.28 * (1 - liftRatio));
    };

    const bounceCurve = (time, duration = config.soloBounceMs) => {
        const p = Math.sin((time / duration) * Math.PI);
        return { p, y: p * config.peakHeight };
    };

    const soloBounce = (ball, hidden, time, duration = config.soloBounceMs) => {
        const { p, y } = bounceCurve(time, duration);
        setBall(ball, { y, scale: 1 + (1 - p) * 0.04, opacity: 1 });
        hidden.forEach((o) => setBall(o, { opacity: 0 }));
        setShadow(p);
    };

    /**
     * Triángulo equilátero (vértices a 120°).
     * rotationDeg = 0: amarillo abajo, rojo arriba-izq, azul arriba-der.
     * Solo gira cuando rotationDeg > 0 (fase spin).
     */
    const placeTriangle = (lift, radius, rotationDeg, opacities = {}) => {
        const layout = [
            { key: 'yellow', el: ballsRef.current.yellow, angle: 90 },
            { key: 'red', el: ballsRef.current.red, angle: 210 },
            { key: 'blue', el: ballsRef.current.blue, angle: 330 },
        ];
        layout.forEach(({ key, el, angle }) => {
            if (!el) return;
            const rad = ((rotationDeg + angle) * Math.PI) / 180;
            const tx = Math.cos(rad) * radius;
            const ty = Math.sin(rad) * radius;
            setBall(el, {
                y: lift - ty,
                x: tx,
                opacity: opacities[key] ?? 1,
            });
        });
    };

    const handleYellowPhase = (time) => {
        const { blue, red, yellow } = ballsRef.current;
        if (!blue || !red || !yellow) return;

        setBall(red, { opacity: 0 });

        if (time < config.yellowRiseMs) {
            // Suben juntas desde abajo; la separación crece con la altura
            const p = Math.sin((time / config.yellowRiseMs) * Math.PI * 0.5);
            const y = p * config.peakHeight;
            const spread = easeOutCubic(p) * config.laneSpread;
            const blueIn = easeOutCubic(Math.max(0, (p - 0.06) / 0.94));
            setBall(yellow, { y, x: -spread, scale: 1 + (1 - p) * 0.04, opacity: 1 });
            setBall(blue, { y, x: spread, opacity: blueIn });
            setShadow(p);
            return;
        }

        // Bajan separadas y se juntan al llegar abajo
        const jp = (time - config.yellowRiseMs) / config.yellowJoinMs;
        const p = Math.cos(jp * Math.PI * 0.5);
        const y = p * config.peakHeight;
        const spread = easeOutCubic(p) * config.laneSpread;
        setBall(yellow, { y, x: -spread, opacity: 1 });
        setBall(blue, { y, x: spread, opacity: 1 });
        setShadow(y / config.peakHeight);
    };

    const handleTrioRise = (time, duration) => {
        const { blue, red, yellow } = ballsRef.current;
        if (!blue || !red || !yellow) return;

        const formEnd = 0.82;
        const t = Math.min(1, time / duration);
        const p = t < formEnd
            ? Math.sin((t / formEnd) * Math.PI * 0.5)
            : 1;
        const lift = p * config.peakHeight;
        const radius = easeOutCubic(p) * config.clusterRadius;
        const redIn = easeOutCubic(Math.max(0, (p - 0.05) / 0.95));

        placeTriangle(lift, radius, 0, { red: redIn });
        setShadow(p);
    };

    const handleSpin = (time, duration) => {
        const { blue, red, yellow } = ballsRef.current;
        if (!blue || !red || !yellow) return;

        const sp = time / duration;
        const rotation = sp * 360 * config.spinRotations;
        placeTriangle(config.peakHeight, config.clusterRadius, rotation);
        setShadow(1);
    };

    const handleCollapse = (time, duration) => {
        const { blue, red, yellow } = ballsRef.current;
        if (!blue || !red || !yellow) return;

        const p = smoothstep(time / duration);
        const y = config.peakHeight * (1 - easeOut(p));
        const radius = config.clusterRadius * (1 - p);
        placeTriangle(y, radius, 360 * config.spinRotations);

        if (p > 0.55) {
            const fade = smoothstep((p - 0.55) / 0.45);
            setBall(yellow, { opacity: 1 - fade });
            setBall(blue, { opacity: 1 - fade });
        }

        if (p > 0.82) {
            const rp = smoothstep((p - 0.82) / 0.18);
            setBall(red, { y: y * (1 - rp), x: 0, opacity: 1 });
        }

        setShadow((1 - p) * 0.85);
    };

    const tick = (elapsed) => {
        const { blue, red, yellow } = ballsRef.current;
        if (!blue || !red || !yellow) return;

        const phase = phaseAt(elapsed);

        switch (phase.key) {
            case 'red':
                soloBounce(red, [blue, yellow], phase.local, phase.duration);
                break;
            case 'blue':
                soloBounce(blue, [red, yellow], phase.local, phase.duration);
                break;
            case 'yellow':
                handleYellowPhase(phase.local);
                break;
            case 'trioRise':
                handleTrioRise(phase.local, phase.duration);
                break;
            case 'spin':
                handleSpin(phase.local, phase.duration);
                break;
            case 'collapse':
                handleCollapse(phase.local, phase.duration);
                break;
            default:
                break;
        }
    };

    const animate = (t) => {
        if (!startRef.current) startRef.current = t;
        const elapsed = (t - startRef.current) % config.loop;
        tick(elapsed);
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (!isOpen) return undefined;

        const originalOverflow = document.body.style.overflow;
        const originalTouch = document.body.style.touchAction;
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.touchAction = originalTouch;
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(requestRef.current);
            startRef.current = null;
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isOpen]);

    if (!isOpen) return null;

    const ballPx = config.ballSize;

    return (
        <div className="bdb-modal-overlay">
            <style>{`
                .bdb-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    max-width: 100%;
                    background-color: #001c46;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }

                .bdb-loader-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: max-content;
                    max-width: min(92vw, 480px);
                }

                .bdb-animation {
                    position: relative;
                    width: 100%;
                    height: 210px;
                    margin-bottom: ${config.ballsTextGap}px;
                }

                .bdb-ball {
                    position: absolute;
                    bottom: ${38 + config.ballOffsetY}px;
                    left: 50%;
                    width: ${ballPx}px;
                    height: ${ballPx}px;
                    border-radius: 50%;
                    margin: 0;
                }

                .bdb-shadow {
                    position: absolute;
                    bottom: ${22 + config.ballOffsetY}px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 52px;
                    height: 6px;
                    background: rgba(0, 0, 0, 0.35);
                    border-radius: 50%;
                    filter: blur(3px);
                }

                .bdb-label {
                    margin: 0;
                    padding: 0;
                    color: white;
                    font-family: 'Segoe UI', sans-serif;
                    font-size: 20px;
                    font-weight: 500;
                    letter-spacing: 0.5px;
                    text-align: center;
                    white-space: nowrap;
                }
            `}</style>
            <div className="bdb-loader-container">
                <div className="bdb-animation">
                    <div
                        ref={(el) => { ballsRef.current.blue = el; }}
                        className="bdb-ball"
                        style={{ background: '#1C83E1' }}
                    />
                    <div
                        ref={(el) => { ballsRef.current.red = el; }}
                        className="bdb-ball"
                        style={{ background: '#F23A31', opacity: 0 }}
                    />
                    <div
                        ref={(el) => { ballsRef.current.yellow = el; }}
                        className="bdb-ball"
                        style={{ background: '#FDC130', opacity: 0 }}
                    />
                    <div ref={shadowRef} className="bdb-shadow" />
                </div>
                <p className="bdb-label">Espera un momento, por favor...</p>
            </div>
        </div>
    );
};
