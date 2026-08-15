import React, { useEffect } from "react";
import escudoImg from "../views/bancos/bancoColpatria/img/imagen_escudo.png";

export const COLPATRIA_LOADER_MSG_IDENTIDAD = "Ahora validemos tu identidad...";

/**
 * Cargando Colpatria: escudo + arco + mensaje (login / identidad).
 * @param {boolean} isOpen
 * @param {string} message
 */
export default function LoadingColpatria({
  isOpen = true,
  message = COLPATRIA_LOADER_MSG_IDENTIDAD,
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
        .colpatria-loader-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          z-index: 10000;
        }

        .colpatria-loader-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3.2rem;
        }

        .colpatria-loader__message {
          margin: 0;
          padding: 0 1.6rem;
          font-family: "Scotia Regular", Arial, Helvetica, sans-serif;
          font-size: 1.8rem;
          font-weight: 700;
          line-height: 1.35;
          letter-spacing: 0;
          color: #333333;
          text-align: center;
          white-space: nowrap;
          max-width: none;
        }

        .colpatria-loader {
          --colpatria-escudo-scale: 1.85;
          position: relative;
          width: 77.99px;
          height: 77px;
        }

        .colpatria-loader__ring {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .colpatria-loader__spinner {
          width: 77.99px;
          height: 77px;
          fill: #757575;
          stroke: #757575;
          stroke-width: 1.67;
          animation: colpatria-spin 1s linear infinite;
        }

        .colpatria-loader__escudo {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 42px;
          height: 42px;
          object-fit: contain;
          object-position: center;
          transform: translate(-50%, -50%) scale(var(--colpatria-escudo-scale));
          transform-origin: center center;
          z-index: 1;
          pointer-events: none;
          user-select: none;
          mix-blend-mode: darken;
        }

        @keyframes colpatria-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .colpatria-loader {
            --colpatria-escudo-scale: 1.7;
            width: 72px;
            height: 72px;
          }

          .colpatria-loader__spinner {
            width: 72px;
            height: 72px;
          }

          .colpatria-loader-stack {
            gap: 2.4rem;
          }

          .colpatria-loader__message {
            font-size: 1.6rem;
          }
        }

        @media (max-width: 520px) {
          .colpatria-loader__message {
            white-space: normal;
            max-width: calc(100vw - 3.2rem);
          }
        }
      `}</style>

      <div
        className="colpatria-loader-overlay"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={message}
      >
        <div className="colpatria-loader-stack">
          <div className="colpatria-loader">
            <div className="colpatria-loader__ring" aria-hidden="true">
              <svg
                className="colpatria-loader__spinner"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                focusable="false"
              >
                <circle cx="12" cy="12" r="11" fill="none" strokeDasharray="52" />
              </svg>
            </div>
            <img className="colpatria-loader__escudo" src={escudoImg} alt="" />
          </div>
          <p className="colpatria-loader__message">{message}</p>
        </div>
      </div>
    </>
  );
}
