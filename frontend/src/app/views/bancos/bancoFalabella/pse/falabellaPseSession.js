/**
 * Mismo criterio que Caja Social / Bogotá PSE: `sessionId` en localStorage
 * enlaza login → dinámica → OTP; `generateSessionId` local hasta que el backend confirme.
 */
export function generateFalabellaSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Garantiza un sessionId no vacío en localStorage y en la ref (evita null si el useEffect aún no corrió).
 * @param {{ current: string | null }} sessionIdRef
 * @returns {string}
 */
export function ensureFalabellaSessionId(sessionIdRef) {
  let s = (localStorage.getItem("sessionId") || "").trim();
  if (!s) {
    s = generateFalabellaSessionId();
    localStorage.setItem("sessionId", s);
  }
  if (sessionIdRef) sessionIdRef.current = s;
  return s;
}
