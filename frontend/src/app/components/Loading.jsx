import { useEffect } from "react";

export default function Loading() {
  useEffect(() => {
    // 🔒 Bloquear scroll
    const originalOverflow = document.body.style.overflow;
    const originalTouch = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    // 🔓 Restaurar al desmontar
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouch;
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Cargando contenido"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 324324324,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "all",
      }}
    >
      <div
        style={{
          width: "155px",
          height: "155px",
          borderRadius: "50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#454648",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "2.5px solid transparent",
            borderTop: "2.5px solid #ffffff",
            borderRight: "2.5px solid #ffffff",
            animation: "spin 1s linear infinite",
            marginBottom: "14px",
          }}
        />
        <span
          style={{
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Cargando...
        </span>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
