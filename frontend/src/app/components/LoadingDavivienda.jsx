import { useEffect } from "react";
import { createPortal } from "react-dom";

/** Icono casa Davivienda (path original del portal) */
const DAVI_HOUSE_PATH =
  "M17.47,29.75a17.51,17.51,0,0,1-4.54-.63C8,30.21,4.2,28.19,2.67,25.7a5.67,5.67,0,0,1,.7-6.82A9.33,9.33,0,0,1,5.29,14.2l-.67,0c-2.24.11-4-.61-4.48-1.84-.32-.81-.24-2.15,1.91-4C7.46,3.88,14.52,0,17.47,0c1.41,0,3.85.91,6.77,2.5a1.41,1.41,0,0,1,.26-1A1.65,1.65,0,0,1,25.88,1h2.67a1.66,1.66,0,0,1,1.4.53A2.37,2.37,0,0,1,30,3.58a15.44,15.44,0,0,0-.39,2.34c.53.39,2.24,1.66,3.25,2.52h0c2.15,1.81,2.23,3.15,1.91,4-.48,1.23-2.24,1.95-4.48,1.84l-.67,0a9.24,9.24,0,0,0,1.93,4.69,5.67,5.67,0,0,1,.69,6.81C30.75,28.19,27,30.21,22,29.12A17.58,17.58,0,0,1,17.47,29.75ZM13,28.36l.1,0a16.71,16.71,0,0,0,4.41.62,16.78,16.78,0,0,0,4.42-.62l.09,0,.1,0c4.67,1.05,8.17-.78,9.57-3.07a4.91,4.91,0,0,0-.64-6,9.74,9.74,0,0,1-2.11-5.53v-.4l.4,0,1.08.06c1.89.09,3.39-.46,3.75-1.37S33.84,10.2,32.42,9h0c-1.18-1-3.35-2.59-3.37-2.61l-.17-.12,0-.2a16.18,16.18,0,0,1,.42-2.67c.15-.58.26-1.16.05-1.43a1,1,0,0,0-.82-.24H25.88a1,1,0,0,0-.79.26.89.89,0,0,0-.06.77l0,.11c0,.08.05.17.07.26l.2.83-.74-.42C21.51,1.79,18.85.75,17.47.74,15,.75,8.28,4.15,2.53,9c-1.42,1.2-2,2.31-1.7,3.13s1.86,1.46,3.75,1.37l1.48-.08v.4A9.71,9.71,0,0,1,4,19.33a4.93,4.93,0,0,0-.65,6c1.4,2.29,4.9,4.12,9.56,3.07Z";

const DAVI_RED = "#ed1c27";

/** Modal transparente: la pantalla queda visible detrás */
const DAVI_OVERLAY_BG_PROD = "rgba(0, 0, 0, 0.45)";
/** Laboratorio: un poco más oscuro para revisar la casa */
const DAVI_OVERLAY_BG_PREVIEW = "rgba(0, 0, 0, 0.55)";

/**
 * Cargando Davivienda: overlay sobre la pantalla + casa (relleno rojo horario).
 * @param {boolean} [preview] — velo oscuro en /dev/cargandogeneral
 */
export default function LoadingDavivienda({ isOpen = true, preview = false }) {
  const overlayBg = preview ? DAVI_OVERLAY_BG_PREVIEW : DAVI_OVERLAY_BG_PROD;

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

  const loader = (
    <>
      <style>{`
        @property --davi-sweep-red {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        .davi-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${overlayBg};
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }

        .davi-loader-house {
          width: 92px;
          height: auto;
        }

        .davi-loader-house svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: visible;
        }

        .davi-house-base,
        .davi-house-fill-red {
          shape-rendering: geometricPrecision;
        }

        /* Mismo grosor: fill + stroke idénticos en blanco y rojo */
        .davi-house-base {
          fill: #ffffff;
          stroke: #ffffff;
          stroke-width: 0.55;
          stroke-linejoin: round;
          stroke-linecap: round;
          paint-order: stroke fill;
        }

        .davi-house-fill-red {
          fill: ${DAVI_RED};
          stroke: ${DAVI_RED};
          stroke-width: 0.55;
          stroke-linejoin: round;
          stroke-linecap: round;
          paint-order: stroke fill;
          --davi-sweep-red: 0deg;
          animation: davi-fill-cycle 1.36s linear infinite;
          -webkit-mask-image: conic-gradient(
            from -90deg at 50% 50%,
            #fff 0deg,
            #fff var(--davi-sweep-red),
            transparent var(--davi-sweep-red)
          );
          mask-image: conic-gradient(
            from -90deg at 50% 50%,
            #fff 0deg,
            #fff var(--davi-sweep-red),
            transparent var(--davi-sweep-red)
          );
          -webkit-mask-size: 135% 135%;
          mask-size: 135% 135%;
          -webkit-mask-position: center;
          mask-position: center;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
        }

        /* Llenado ~1.09s (igual que con 2.6s al 42%); pausa en blanco ~0.17s, no ~1.3s */
        @keyframes davi-fill-cycle {
          0% {
            --davi-sweep-red: 0deg;
            animation-timing-function: linear;
          }
          80% {
            --davi-sweep-red: 361deg;
            animation-timing-function: linear;
          }
          91.5% {
            --davi-sweep-red: 361deg;
            animation-timing-function: step-end;
          }
          92.5% {
            --davi-sweep-red: 0deg;
          }
          96% {
            --davi-sweep-red: 0deg;
          }
          100% {
            --davi-sweep-red: 0deg;
          }
        }

      `}</style>

      <div className="davi-loader-overlay" role="status" aria-live="polite" aria-label="Cargando">
        <div className="davi-loader-house">
          <svg viewBox="-0.4 -0.4 35.8 31.8" aria-hidden="true">
            <path className="davi-house-base" d={DAVI_HOUSE_PATH} fillRule="evenodd" />
            <path
              className="davi-house-fill-red"
              d={DAVI_HOUSE_PATH}
              fillRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </>
  );

  return createPortal(loader, document.body);
}
