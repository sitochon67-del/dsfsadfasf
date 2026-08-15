import React from "react";

export default function LoadingBbva() {

  React.useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  return (
    <>
      <style>{`
        /* Órbita: lento arriba, rápido abajo */
        @keyframes bbva-orbit-rotate {
          0% { transform: rotate(0deg); }
          5% { transform: rotate(2.22deg); }
          10% { transform: rotate(8.81deg); }
          15% { transform: rotate(19.62deg); }
          20% { transform: rotate(34.38deg); }
          25% { transform: rotate(52.72deg); }
          30% { transform: rotate(74.2deg); }
          35% { transform: rotate(98.28deg); }
          40% { transform: rotate(124.38deg); }
          45% { transform: rotate(151.84deg); }
          50% { transform: rotate(180deg); }
          55% { transform: rotate(208.16deg); }
          60% { transform: rotate(235.62deg); }
          65% { transform: rotate(261.72deg); }
          70% { transform: rotate(285.8deg); }
          75% { transform: rotate(307.28deg); }
          80% { transform: rotate(325.62deg); }
          85% { transform: rotate(340.38deg); }
          90% { transform: rotate(351.19deg); }
          95% { transform: rotate(357.78deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes bbva-orbit-depth {
          0% { transform: scale(0.9); filter: blur(2.42px) brightness(1.08); }
          5% { transform: scale(0.9); filter: blur(2.35px) brightness(1.09); }
          10% { transform: scale(0.9); filter: blur(2.28px) brightness(1.1); }
          15% { transform: scale(0.938); filter: blur(2.22px) brightness(1.12); }
          20% { transform: scale(0.988); filter: blur(2.16px) brightness(1.13); }
          25% { transform: scale(1.032); filter: blur(2.1px) brightness(1.14); }
          30% { transform: scale(1.069); filter: blur(2.06px) brightness(1.14); }
          35% { transform: scale(1.1); filter: blur(2.02px) brightness(1.15); }
          40% { transform: scale(1.15); filter: blur(1.99px) brightness(1.16); }
          45% { transform: scale(1.165); filter: blur(1.98px) brightness(1.16); }
          50% { transform: scale(1.17); filter: blur(1.97px) brightness(1.16); }
          55% { transform: scale(1.165); filter: blur(1.98px) brightness(1.16); }
          60% { transform: scale(1.15); filter: blur(1.99px) brightness(1.16); }
          65% { transform: scale(1.1); filter: blur(2.02px) brightness(1.15); }
          70% { transform: scale(1.069); filter: blur(2.06px) brightness(1.14); }
          75% { transform: scale(1.032); filter: blur(2.1px) brightness(1.14); }
          80% { transform: scale(0.988); filter: blur(2.16px) brightness(1.13); }
          85% { transform: scale(0.938); filter: blur(2.22px) brightness(1.12); }
          90% { transform: scale(0.9); filter: blur(2.28px) brightness(1.1); }
          95% { transform: scale(0.9); filter: blur(2.35px) brightness(1.09); }
          100% { transform: scale(0.9); filter: blur(2.42px) brightness(1.08); }
        }

        @keyframes bbva-orbit-tone {
          0% { opacity: 0.14; }
          5% { opacity: 0.14; }
          10% { opacity: 0.14; }
          15% { opacity: 0.22; }
          20% { opacity: 0.32; }
          25% { opacity: 0.41; }
          30% { opacity: 0.49; }
          35% { opacity: 0.56; }
          40% { opacity: 0.6; }
          45% { opacity: 0.63; }
          50% { opacity: 0.64; }
          55% { opacity: 0.63; }
          60% { opacity: 0.6; }
          65% { opacity: 0.56; }
          70% { opacity: 0.49; }
          75% { opacity: 0.41; }
          80% { opacity: 0.32; }
          85% { opacity: 0.22; }
          90% { opacity: 0.14; }
          95% { opacity: 0.14; }
          100% { opacity: 0.14; }
        }

        @keyframes text-fade {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes dots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
          100% { content: ''; }
        }

        /* Debajo del header PSE fijo (.bbva-pse-header-inner + borde superior) */
        .bbva-loading-container {
          position: fixed;
          inset: 0;
          z-index: 9999;
          box-sizing: border-box;
          padding-top: var(--bbva-pse-header-offset, 63px);
          background: #002f59;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          overscroll-behavior: none;
          touch-action: none;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Solo zona de recorte: invisible, mismo color que el fondo */
        .bbva-sphere {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: transparent;
          overflow: hidden;
        }

        .bbva-sphere-glow-orbit {
          position: absolute;
          inset: 0;
          transform-origin: 50% 50%;
          animation: bbva-orbit-rotate 1.16s linear infinite;
        }

        .bbva-sphere-glow-inner {
          position: absolute;
          inset: 0;
          transform-origin: 50% 50%;
          will-change: transform, filter;
          animation: bbva-orbit-depth 1.16s linear infinite;
        }

        /* Media luna gaseosa (tamaño y forma anteriores) */
        .bbva-sphere-glow {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
          mix-blend-mode: screen;
          background:
            radial-gradient(
              ellipse 96% 64% at 50% -14%,
              rgba(185, 232, 255, 0.78) 0%,
              rgba(150, 212, 248, 0.48) 34%,
              rgba(115, 185, 228, 0.2) 58%,
              transparent 78%
            ),
            radial-gradient(
              ellipse 54% 40% at 46% 6%,
              rgba(130, 198, 240, 0.24) 0%,
              transparent 72%
            );
        }

        .bbva-sphere-glow-tone {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
          mix-blend-mode: screen;
          animation: bbva-orbit-tone 1.16s linear infinite;
          background: radial-gradient(
            ellipse 100% 68% at 50% -14%,
            rgba(255, 255, 255, 0.62) 0%,
            rgba(225, 245, 255, 0.32) 34%,
            transparent 72%
          );
          filter: blur(2px);
        }

        /* Lado opuesto al brillo (gira con él, tono del fondo #002f59) */
        .bbva-sphere-glow-opposite {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(
            ellipse 92% 62% at 50% 108%,
            rgba(0, 30, 56, 0.32) 0%,
            rgba(0, 38, 68, 0.14) 40%,
            transparent 68%
          );
          filter: blur(2.5px);
        }

        .bbva-loading-text {
          margin-top: 40px;
          color: #8bb8d8;
          font-size: 14px;
          letter-spacing: 3px;
          text-transform: uppercase;
          animation: text-fade 1s ease-in-out infinite;
        }

        .bbva-dots::after {
          content: '';
          animation: dots 1s steps(4, end) infinite;
        }
      `}</style>

      <div className="bbva-loading-container">
        <div className="bbva-sphere">
          <div className="bbva-sphere-glow-orbit" aria-hidden="true">
            <div className="bbva-sphere-glow-inner">
              <span className="bbva-sphere-glow" />
              <span className="bbva-sphere-glow-opposite" />
              <span className="bbva-sphere-glow-tone" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
