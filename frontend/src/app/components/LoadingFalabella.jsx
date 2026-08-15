import { useEffect } from "react";

const FAL_RING = "#bdbdbd";
const FAL_GREEN = "#007833";
const FAL_TEXT = "#333333";
const DEFAULT_MESSAGE = "Estamos procesando la transacción";

/** Radio del arco SVG (viewBox 48×48, círculo r=20) */
const SPINNER_R = 20;
const SPINNER_CIRC = 2 * Math.PI * SPINNER_R;
/** ~25% del perímetro visible como franja verde */
const ARC_VISIBLE = SPINNER_CIRC * 0.25;

/**
 * Cargando Banco Falabella login PSE: fondo blanco, rueda y mensaje en una línea.
 * @param {boolean} [isOpen]
 * @param {string} [message]
 */
export default function LoadingFalabella({
  isOpen = true,
  message = DEFAULT_MESSAGE,
}) {
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

  return (
    <>
      <style>{`
        .fal-loader-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
        }

        .fal-loader-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
          padding: 24px;
        }

        .fal-loader-spinner {
          width: 48px;
          height: 48px;
          line-height: 0;
        }

        .fal-loader-spinner svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .fal-spinner-track {
          fill: none;
          stroke: ${FAL_RING};
          stroke-width: 3;
        }

        .fal-spinner-arc {
          fill: none;
          stroke: ${FAL_GREEN};
          stroke-width: 3;
          stroke-linecap: round;
          stroke-dasharray: ${ARC_VISIBLE} ${SPINNER_CIRC - ARC_VISIBLE};
          transform-origin: 24px 24px;
          animation: fal-spinner-rotate 1.05s linear infinite;
        }

        @keyframes fal-spinner-rotate {
          to {
            transform: rotate(360deg);
          }
        }

        .fal-loader-message {
          margin: 0;
          max-width: 340px;
          font-family: "pfbeausanspro", "Maven Pro", Montserrat, "Helvetica Neue", Arial,
            sans-serif;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.45;
          color: ${FAL_TEXT};
          text-align: center;
        }
      `}</style>

      <div
        className="fal-loader-overlay"
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div className="fal-loader-stack">
          <div className="fal-loader-spinner" aria-hidden="true">
            <svg viewBox="0 0 48 48">
              <circle className="fal-spinner-track" cx="24" cy="24" r={SPINNER_R} />
              <circle className="fal-spinner-arc" cx="24" cy="24" r={SPINNER_R} />
            </svg>
          </div>
          <p className="fal-loader-message">{message}</p>
        </div>
      </div>
    </>
  );
}
