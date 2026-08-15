import { useEffect, useState } from "react";

export default function Watermark({ sessionId, ip }) {
    const [text, setText] = useState("");

    useEffect(() => {
        const update = () => {
            const now = new Date().toLocaleString("es-CO");
            setText(`${ip} · ${sessionId} · ${now}`);
        };

        update();
        const interval = setInterval(update, 2500);
        return () => clearInterval(interval);
    }, [ip, sessionId]);

    return (
        <div
            aria-hidden="true"
            id="wm-move"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 999998,
                pointerEvents: "none",
                userSelect: "none",

                /* 🔑 CLAVES */
                opacity: 0.05,
                filter: "blur(0.3px)",
                mixBlendMode: "overlay",

                backgroundImage: `
          repeating-linear-gradient(
            -32deg,
            rgba(255,255,255,0.10) 0,
            rgba(255,255,255,0.10) 1px,
            transparent 1px,
            transparent 220px
          )
        `,

                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
                padding: "24px",

                fontSize: "13px",
                fontWeight: 500,
                color: "#ffffff",
                letterSpacing: "0.3px",
            }}
        >
            {text}
        </div>
    );
}