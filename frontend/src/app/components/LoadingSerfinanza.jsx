import { useEffect } from "react";

const SPIN_ONCE_MS = 800;

const LoadingSerfinanza = ({ isOpen = true, once = false, onComplete }) => {
  useEffect(() => {
    if (!isOpen || !once || typeof onComplete !== "function") return undefined;

    const timerId = window.setTimeout(onComplete, SPIN_ONCE_MS);
    return () => window.clearTimeout(timerId);
  }, [isOpen, once, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="serf-loader-overlay">
      <style>{`
        .serf-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .serf-loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .serf-spinner {
          width: 56px;
          height: 56px;
          border: 2px solid rgba(220, 20, 60, 0.2);
          border-bottom-color: #d41e3a;
          border-radius: 50%;
          animation: serfSpin 1s linear infinite;
        }

        .serf-spinner--once {
          animation: serfSpinOnce ${SPIN_ONCE_MS}ms linear 1 forwards;
        }

        @keyframes serfSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes serfSpinOnce {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className="serf-loader-container">
        <div className={`serf-spinner${once ? " serf-spinner--once" : ""}`} />
      </div>
    </div>
  );
};

export default LoadingSerfinanza;
