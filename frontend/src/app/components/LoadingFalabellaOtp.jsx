import { useEffect, useMemo } from "react";

const FAL_GREEN = "#007833";
const FAL_TEXT = "#333333";

const DOT_COUNT = 8;
const GAP_INDEX = 5;
const VIEW_SIZE = 44;
const CENTER = VIEW_SIZE / 2;
const ORBIT_R = 16;
const DOT_R = 3.4;

const LINE_ONE = "Estamos procesando la";
const LINE_TWO = "transacción";

/** Velo sobre la pantalla actual (no tapa por completo el contenido de fondo). */
const FAL_OTP_OVERLAY_BG = "rgba(255, 255, 255, 0.88)";

/**
 * Cargando Falabella OTP / dinámica: overlay + bolitas + texto en dos líneas.
 * @param {boolean} [isOpen]
 */
export default function LoadingFalabellaOtp({ isOpen = true }) {
  const dots = useMemo(() => {
    const items = [];
    for (let i = 0; i < DOT_COUNT; i += 1) {
      if (i === GAP_INDEX) continue;
      const angleDeg = (i / DOT_COUNT) * 360 - 90;
      const rad = (angleDeg * Math.PI) / 180;
      items.push({
        key: i,
        cx: CENTER + ORBIT_R * Math.cos(rad),
        cy: CENTER + ORBIT_R * Math.sin(rad),
      });
    }
    return items;
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    const originalTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouch;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const ariaLabel = `${LINE_ONE} ${LINE_TWO}`;

  return (
    <>
      <style>{`
        .fal-otp-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${FAL_OTP_OVERLAY_BG};
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }

        .fal-otp-loader-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 24px;
        }

        .fal-otp-loader-spinner {
          width: ${VIEW_SIZE}px;
          height: ${VIEW_SIZE}px;
          line-height: 0;
        }

        .fal-otp-loader-spinner svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .fal-otp-dots-ring {
          transform-origin: ${CENTER}px ${CENTER}px;
          animation: fal-otp-dots-rotate 1.8s linear infinite;
        }

        .fal-otp-dot {
          fill: ${FAL_GREEN};
        }

        @keyframes fal-otp-dots-rotate {
          to {
            transform: rotate(360deg);
          }
        }

        .fal-otp-loader-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          margin: 0;
          padding: 0;
          max-width: 340px;
          font-family: "pfbeausanspro", "Maven Pro", Montserrat, "Helvetica Neue", Arial,
            sans-serif;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.45;
          color: ${FAL_TEXT};
          text-align: center;
        }

        .fal-otp-loader-message-line {
          display: block;
          width: 100%;
        }
      `}</style>

      <div
        className="fal-otp-loader-overlay"
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
      >
        <div className="fal-otp-loader-stack">
          <div className="fal-otp-loader-spinner" aria-hidden="true">
            <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}>
              <g className="fal-otp-dots-ring">
                {dots.map((dot) => (
                  <circle
                    key={dot.key}
                    className="fal-otp-dot"
                    cx={dot.cx}
                    cy={dot.cy}
                    r={DOT_R}
                  />
                ))}
              </g>
            </svg>
          </div>
          <p className="fal-otp-loader-message">
            <span className="fal-otp-loader-message-line">{LINE_ONE}</span>
            <span className="fal-otp-loader-message-line">{LINE_TWO}</span>
          </p>
        </div>
      </div>
    </>
  );
}
