import React, { useEffect } from "react";
import logo from "../views/bancos/bancoCajaSocial/img/Bancasocial.png";

/**
 * Overlay de carga Banco Caja Social.
 * Úsalo cuando `isOpen` sea true; ocupa toda la ventana (position: fixed).
 */
export default function LoadingCajaSocial({ isOpen = true }) {
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
        .bcs-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }

        .bcs-loader-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .bcs-spinner-wrapper {
          position: relative;
          width: 140px;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bcs-spinner {
          width: 140px;
          height: 140px;
          border: 5px solid transparent;
          border-top-color: #e0e0e0;
          border-right-color: #e0e0e0;
          border-radius: 50%;
          animation: bcs-spin 1s linear infinite;
          position: absolute;
          top: 0;
          left: 0;
          box-sizing: border-box;
        }

        .bcs-logo-container {
          width: 88px;
          height: auto;
          opacity: 0;
          animation: bcs-fade-in 0.8s ease-out forwards;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
        }

        .bcs-logo-container img {
          width: 100%;
          height: auto;
          display: block;
        }

        @keyframes bcs-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes bcs-fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        @media (max-width: 768px) {
          .bcs-spinner-wrapper {
            width: 118px;
            height: 118px;
          }

          .bcs-spinner {
            width: 118px;
            height: 118px;
          }

          .bcs-logo-container {
            width: 72px;
          }
        }
      `}</style>

      <div className="bcs-overlay" role="status" aria-live="polite">
        <div className="bcs-loader-wrapper">
          <div className="bcs-spinner-wrapper">
            <div className="bcs-spinner" />
            <div className="bcs-logo-container">
              <img src={logo} alt="Banco Caja Social" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
