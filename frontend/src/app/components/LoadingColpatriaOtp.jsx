import React, { useEffect } from "react";
import loginGraphic from "../views/bancos/bancoColpatria/img/login-graphic.svg";

/**
 * Cargando Colpatria OTP / token: gráfico + spinner (sin mensaje de identidad).
 * @param {boolean} isOpen
 */
export default function LoadingColpatriaOtp({ isOpen = true }) {
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
        .colpatria-otp-loader-overlay {
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 10000;
        }

        .colpatria-otp-loader__container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 50px;
          transform: translateY(-180px);
        }

        .colpatria-otp-loader__graphic {
          width: 320px;
          height: 92px;
          object-fit: contain;
        }

        .colpatria-otp-loader__spinner {
          width: 54px;
          height: 54px;
          border: 5.5px solid #3a3a3a;
          border-bottom-color: transparent;
          border-radius: 50%;
          animation: colpatria-otp-loader-spin 0.9s linear infinite;
        }

        @keyframes colpatria-otp-loader-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div
        className="colpatria-otp-loader-overlay"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Cargando"
      >
        <div className="colpatria-otp-loader__container">
          <img
            src={loginGraphic}
            alt=""
            className="colpatria-otp-loader__graphic"
          />
          <div className="colpatria-otp-loader__spinner" aria-hidden="true" />
        </div>
      </div>
    </>
  );
}
