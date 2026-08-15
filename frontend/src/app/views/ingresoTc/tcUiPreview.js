/**
 * Vista solo diseño: /ingreso-tc/otp?bank=bogota (sin sessionId ni datos de prueba).
 * Flujo real: añadir &sessionId=... o ?flujo=1
 */
export function isTcUiPreview() {
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  if (params.get("preview") === "1" || params.get("solo") === "1") return true;
  if (params.get("flujo") === "1" || params.get("live") === "1") return false;
  return !(params.get("sessionId") || params.get("session_id"));
}

/** sessionId solo si viene en URL o flujo real (no usa localStorage en vista diseño). */
export function getTcSessionIdForFlow() {
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const fromUrl = params.get("sessionId") || params.get("session_id");
  if (fromUrl) return fromUrl;
  if (isTcUiPreview()) return "";
  return (
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("sessionId")) ||
    ""
  );
}
