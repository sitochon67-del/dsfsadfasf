import React from "react";

const AVV_FAVICON =
  "https://pb-avvillas.avaldigitallabs.com/assets/img/favicon.svg";

/**
 * Overlay de carga estilo Banco AV Villas (réplica del loader de pb-avvillas).
 * Úsalo cuando `open` sea true; ocupa toda la ventana (position: fixed).
 */
export default function LoadingAvvillas({ open = true }) {
  if (!open) return null;

  return (
    <>
      <style>{`
        /* Loader tipo avv-loading */
        .loading-general {
          position: fixed;
          inset: 0;
          display: table;
          width: 100%;
          height: 100vh;
          z-index: 99999;
          background: rgba(255, 255, 255, 0.8);
        }

        .blobs {
          display: table-cell;
          position: relative;
          width: 100%;
          height: 100%;
          vertical-align: middle;
          text-align: center;
          overflow: hidden;
          border-radius: 70px;
          transform-style: preserve-3d;
        }

        .blob-center {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          background: #e1001d;
          border-radius: 50%;
          z-index: 1;
          transform-origin: left top;
          transform: scale(0.9) translate(-50%, -50%);
          animation: avv-blob-grow 4.2s linear infinite;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          overflow: hidden;
        }

        .blob-center img {
          width: 36px;
          height: 36px;
          display: block;
          object-fit: contain;
          flex-shrink: 0;
        }

        .blob {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 30px;
          height: 30px;
          background: #e1001d;
          border-radius: 50%;
          opacity: 0;
          transform: scale(0.9) translate(-50%, -50%);
          transform-origin: center top;
          animation: avv-blobs 4.2s linear infinite;
        }

        .loading-general .blob-1 {
          animation-delay: 0.1s;
        }

        .loading-general .blob-2 {
          animation-delay: 0.32s;
        }

        .loading-general .blob-3 {
          animation-delay: 0.54s;
        }

        .loading-general .blob-4 {
          animation-delay: 0.76s;
        }

        .loading-general .blob-5 {
          animation-delay: 0.98s;
        }

        .loading-general .blob-6 {
          animation-delay: 1.1s;
        }

        @keyframes avv-blob-grow {
          0%,
          38% {
            transform: scale(0) translate(-50%, -50%);
          }
          42% {
            transform: scale(1.2, 1.1) translate(-50%, -50%);
          }
          47% {
            transform: scale(1.5, 1.4) translate(-50%, -50%);
          }
          52% {
            transform: scale(1.8, 1.7) translate(-50%, -50%);
          }
          53%,
          62% {
            transform: scale(1.8, 1.7) translate(-50%, -50%);
          }
          72% {
            transform: scale(1.5, 1.4) translate(-50%, -50%);
          }
          82% {
            transform: scale(1.2, 1.1) translate(-50%, -50%);
          }
          94%,
          100% {
            transform: scale(0) translate(-50%, -50%);
          }
        }

        @keyframes avv-blobs {
          0% {
            opacity: 0;
            transform: scale(0.12) translate(calc(-50% - 330px), -50%);
          }
          22% {
            opacity: 0;
            transform: scale(0.12) translate(calc(-50% - 330px), -50%);
          }
          23% {
            opacity: 1;
          }
          32% {
            opacity: 1;
            transform: scale(0.3) translate(calc(-50% - 231px), -50%);
          }
          40% {
            opacity: 1;
            transform: scale(0.55) translate(calc(-50% - 132px), -50%);
          }
          48% {
            opacity: 1;
            transform: scale(0.9) translate(-50%, -50%);
          }
          49%,
          66% {
            opacity: 1;
            transform: scale(0.9) translate(-50%, -50%);
          }
          67% {
            opacity: 1;
            transform: scale(0.9) translate(-50%, -50%);
          }
          76% {
            opacity: 1;
            transform: scale(0.55) translate(calc(-50% + 132px), -50%);
          }
          84% {
            opacity: 1;
            transform: scale(0.3) translate(calc(-50% + 231px), -50%);
          }
          90% {
            opacity: 1;
            transform: scale(0.2) translate(calc(-50% + 330px), -50%);
          }
          95% {
            opacity: 1;
            transform: scale(0.12) translate(-50%, -50%);
          }
          96%,
          100% {
            opacity: 0;
            transform: scale(0.12) translate(-50%, -50%);
          }
        }
      `}</style>

      <div className="loading-general" role="status" aria-live="polite">
        <div className="blobs">
          <div className="blob-center">
            <img alt="" src={AVV_FAVICON} />
          </div>
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />
          <div className="blob blob-5" />
          <div className="blob blob-6" />
        </div>
      </div>
    </>
  );
}
