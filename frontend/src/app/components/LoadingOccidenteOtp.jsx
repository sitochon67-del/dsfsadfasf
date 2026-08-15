import logo from "../views/bancos/bancoOccidente/img/final_occidente_spinner2.gif";

export default function LoadingOccidenteOtp({ isOpen = true }) {
  if (!isOpen) return null;

  return (
    <div className="bdb-modal-overlay">
      <style>{`
        :root {
          --bg-overlay: rgba(255, 255, 255, 0.98);
        }

        .bdb-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: var(--bg-overlay);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          animation: bdbFadeIn 0.3s ease-out;
        }

        .bdb-spinner-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .bdb-spinner-img {
          height: 90px;
          width: auto;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.05));
        }

        @keyframes bdbFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div className="bdb-spinner-wrapper">
        <img src={logo} alt="Cargando" className="bdb-spinner-img" />
      </div>
    </div>
  );
}
