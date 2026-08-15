function GhostWatermark({ token }) {
    return (
        <div
            aria-hidden="true"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 999997,
                pointerEvents: "none",
                userSelect: "none",

                opacity: 0.008,   // 🔑 CLAVE
                fontSize: "120px",
                fontWeight: 900,
                color: "#ffffff",

                transform: "rotate(-33deg)",
                filter: "blur(1px)",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {token}
        </div>
    );
}

export default GhostWatermark;