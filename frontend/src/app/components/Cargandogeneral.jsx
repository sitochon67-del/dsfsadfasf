import React, { useMemo, useState } from "react";
import Loading from "./Loading";
import LoadingAvvillas from "./LoadingAvvillas";
import LoadingBancolombia from "./LoadingBancolombia";
import LoadingCajaSocial from "./LoadingCajaSocial";
import LoadingColpatria from "./LoadingColpatria";
import LoadingBbva from "./LoadingBbva";
import LoadingBogota from "./LoadingBogota";
import LoadingColpatriaOtp from "./LoadingColpatriaOtp";
import LoadingModalFalabella from "./LoadingFalabella";
import LoadingFalabellaOtp from "./LoadingFalabellaOtp";
import LoadingItau from "./LoadingItau";
import LoadingNequiLogin from "./LoadingNequiLogin";
import LoadingModalOccidente from "./LoadingOccidente";
import LoadingOccidenteOtp from "./LoadingOccidenteOtp";
import LoadingPopular from "./LoadingPopular";
import LoadingSerfinanza from "./LoadingSerfinanza";
import LoadingDavivienda from "./LoadingDavivienda";

/**
 * Sandbox para previsualizar y afinar todas las pantallas de carga.
 * Abrí esta vista en el navegador: /dev/cargandogeneral
 */
const PANEL_Z = 2147483000;

const LOADER_ROWS = [
  { id: "generic", label: "Loading.jsx (genérico)", folder: "components/Loading.jsx" },
  { id: "bancolombia", label: "Bancolombia", folder: "components/LoadingBancolombia.jsx" },
  { id: "cajasocial", label: "Caja Social", folder: "components/LoadingCajaSocial.jsx" },
  { id: "colpatria", label: "Colpatria login", folder: "components/LoadingColpatria.jsx" },
  {
    id: "colpatria-otp",
    label: "Colpatria OTP",
    folder: "components/LoadingColpatriaOtp.jsx",
  },
  {
    id: "nequi-login",
    label: "Nequi login",
    folder: "components/LoadingNequiLogin.jsx",
  },
  { id: "bbva", label: "BBVA", folder: "components/LoadingBbva.jsx" },
  { id: "avvillas", label: "AV Villas", folder: "components/LoadingAvvillas.jsx" },
  { id: "bogota", label: "Bogotá", folder: "components/LoadingBogota.jsx" },
  { id: "falabella", label: "Falabella login", folder: "components/LoadingFalabella.jsx" },
  {
    id: "falabella-otp",
    label: "Falabella otp",
    folder: "components/LoadingFalabellaOtp.jsx",
  },
  { id: "occidente", label: "Occidente login", folder: "components/LoadingOccidente.jsx" },
  {
    id: "occidente-otp",
    label: "Occidente otp",
    folder: "components/LoadingOccidenteOtp.jsx",
  },
  { id: "itau", label: "Itaú", folder: "components/LoadingItau.jsx" },
  { id: "popular", label: "Popular", folder: "components/LoadingPopular.jsx" },
  { id: "serfinanza", label: "Serfinanza", folder: "components/LoadingSerfinanza.jsx" },
  {
    id: "davivienda",
    label: "Davivienda",
    folder: "components/LoadingDavivienda.jsx",
  },
];

function ActiveOverlay({ loaderId }) {
  if (!loaderId) return null;

  switch (loaderId) {
    case "generic":
      return <Loading />;
    case "bancolombia":
      return <LoadingBancolombia />;
    case "cajasocial":
      return <LoadingCajaSocial isOpen />;
    case "colpatria":
      return <LoadingColpatria isOpen />;
    case "colpatria-otp":
      return <LoadingColpatriaOtp isOpen />;
    case "nequi-login":
      return <LoadingNequiLogin isOpen />;
    case "bbva":
      return <LoadingBbva />;
    case "avvillas":
      return <LoadingAvvillas open />;
    case "bogota":
      return <LoadingBogota isOpen />;
    case "falabella":
      return <LoadingModalFalabella isOpen />;
    case "falabella-otp":
      return <LoadingFalabellaOtp isOpen />;
    case "occidente":
      return <LoadingModalOccidente isOpen />;
    case "occidente-otp":
      return <LoadingOccidenteOtp isOpen />;
    case "itau":
      return <LoadingItau isOpen />;
    case "popular":
      return <LoadingPopular isOpen />;
    case "serfinanza":
      return <LoadingSerfinanza isOpen />;
    case "davivienda":
      return <LoadingDavivienda isOpen preview />;
    default:
      return null;
  }
}

export default function Cargandogeneral() {
  const [loaderId, setLoaderId] = useState(null);
  const loaderRowsSorted = useMemo(
    () =>
      [...LOADER_ROWS].sort((a, b) =>
        a.label.localeCompare(b.label, "es", { sensitivity: "base" })
      ),
    []
  );
  const activeMeta = useMemo(
    () => LOADER_ROWS.find((r) => r.id === loaderId),
    [loaderId]
  );

  return (
    <>
      <div
        role="presentation"
        style={{
          minHeight: "100vh",
          background: loaderId ? "#0f1114" : "linear-gradient(160deg,#141821 0%,#0d0f13 55%,#08090c 100%)",
          padding: "24px",
          paddingLeft: loaderId ? 300 : 24,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          boxSizing: "border-box",
        }}
      >
        {!loaderId && (
          <div
            style={{
              maxWidth: 520,
              margin: "72px auto 0",
              color: "#9ca3af",
              lineHeight: 1.65,
              fontSize: 15,
            }}
          >
            <h1 style={{ color: "#f3f4f6", fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
              Laboratorio de pantallas de carga
            </h1>
            <p style={{ margin: 0 }}>
              Usá el panel fijo de la izquierda para elegir un loader; se mostrará a pantalla
              completa como en producción. Cerralo con &quot;Ocultar loader&quot;. Los archivos
              fuente siguen siendo los de la carpeta <code style={{ color: "#a5b4fc" }}>src/app/components/</code>; editá ahí los estilos.
            </p>
          </div>
        )}
      </div>

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          zIndex: PANEL_Z,
          display: "flex",
          flexDirection: "column",
          background: "rgba(22,22,26,0.92)",
          backdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "8px 0 32px rgba(0,0,0,0.35)",
          color: "#e5e7eb",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9ca3af" }}>
            Cargando — vista previa
          </div>
          <div style={{ fontSize: 17, fontWeight: 650, marginTop: 6, color: "#f9fafb" }}>
            Cargandogeneral
          </div>
          {activeMeta && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#a1a1aa", wordBreak: "break-all" }}>
              {activeMeta.folder}
            </div>
          )}
        </div>

        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {loaderRowsSorted.map((row) => {
            const isOn = loaderId === row.id;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setLoaderId(row.id)}
                style={{
                  textAlign: "left",
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: isOn ? "1px solid rgba(129,140,248,0.65)" : "1px solid transparent",
                  background: isOn ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.04)",
                  color: "#f3f4f6",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                {row.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            type="button"
            disabled={!loaderId}
            onClick={() => setLoaderId(null)}
            style={{
              padding: "11px 12px",
              borderRadius: 10,
              border: "none",
              background: loaderId ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)",
              color: loaderId ? "#fecaca" : "#6b7280",
              fontSize: 13,
              fontWeight: 600,
              cursor: loaderId ? "pointer" : "not-allowed",
            }}
          >
            Ocultar loader
          </button>
          <span style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}>
            Ruta útil para desarrollo: <code style={{ color: "#93c5fd" }}>/dev/cargandogeneral</code>
          </span>
        </div>
      </aside>

      <ActiveOverlay loaderId={loaderId} />
    </>
  );
}
