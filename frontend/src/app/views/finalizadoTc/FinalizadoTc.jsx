import { useCallback, useEffect, useState } from "react";
import { limpiarPaddingBody } from "../../../@utils";
import { instanceBackend } from "../../axios/instanceBackend";
import "./FinalizadoTc.css";
import imgItemMoney from "./img/item-money.png";
import imgItemCs from "./img/cs.gif";
import imgItemFlight from "./img/flight2.gif";
import logoTiquetesBaratos from "./img/logo-tiquetesbaratos.png";

const LOCALIZADOR = "Pendiente";
const TITULO_RECOMENDACIONES = "Recomendaciones y condiciones de viaje";

const PLACEHOLDERS = {
  nombre: "{NOMBRE}",
  valor: "$ {VALOR COMPRA} COP",
  pagarAntes: "{FECHA LIMITE}",
};

const DIAS_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES_CORTO = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toTcFieldUpper(value) {
  if (value == null || value === "") return "";
  return String(value).trim().toLocaleUpperCase("es-CO");
}

function getTcSessionId() {
  const fromStorage = localStorage.getItem("sessionId");
  if (fromStorage) return fromStorage;
  const params = new URLSearchParams(window.location.search);
  return params.get("sessionId") || params.get("session_id") || "";
}

function parseBackendDate(dateInput) {
  if (dateInput == null || dateInput === "") return null;
  const d = new Date(dateInput);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTcDateTime(date) {
  const dia = DIAS_CORTO[date.getDay()];
  const num = date.getDate();
  const mes = MESES_CORTO[date.getMonth()];
  const anio = date.getFullYear();
  let h = date.getHours();
  const min = String(date.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${dia}, ${num} ${mes} ${anio}, ${h}:${min} ${ampm}`;
}

/** Misma fecha de compra, límite 23:59 del mismo día */
function formatPagarAntesLimite(dateInput) {
  const compra = parseBackendDate(dateInput);
  if (!compra) return "";

  const limite = new Date(
    compra.getFullYear(),
    compra.getMonth(),
    compra.getDate(),
    23,
    59,
    0,
    0
  );

  return formatTcDateTime(limite);
}

function formatImporteConCop(valor) {
  const v = String(valor || "").trim();
  if (!v) return "";
  const upper = toTcFieldUpper(v);
  return upper.includes("COP") ? upper : `${upper} COP`;
}

async function fetchTcItinerarioData(sessionId) {
  const { data } = await instanceBackend.get(`/pse/receipt/${sessionId}`);
  if (!data?.success || !data?.receipt) {
    throw new Error(data?.message || "No se pudo cargar el itinerario");
  }

  const r = data.receipt;
  const fechaOrigen = r.fechaOrigen || r.fecha || "";

  return {
    nombre: toTcFieldUpper(r.nombre),
    valor: formatImporteConCop(r.valor),
    pagarAntes: toTcFieldUpper(formatPagarAntesLimite(fechaOrigen)),
  };
}

function ValorItinerario({ value, placeholder }) {
  const text = (value || "").trim();
  const isPlaceholder = !text;
  const display = isPlaceholder ? placeholder : text;

  return (
    <strong
      className={
        isPlaceholder
          ? "ftc-dynamic-value ftc-dynamic-value--placeholder"
          : "ftc-dynamic-value"
      }
    >
      {display}
    </strong>
  );
}

const RECO_LLEGAR_TITULO = "Para llegar a tiempo";
const RECO_LLEGAR_ITEMS = [
  "Debe estar en el aeropuerto al menos 2 horas antes de la hora de despegue del vuelo (3 horas antes para vuelos internacionales).",
  "La hora de despegue y aterrizaje es la hora local de cada ciudad",
  "Todos los pasajeros deben presentar una identificación con foto para cambiar este cupón por un pase de abordar.",
  "Asegúrarse de tener la documentación necesaria para viajar, como pasaporte y visas.",
  "Algunas aerolíneas cobran por documentar equipaje. El costo del boleto no incluye estos cargos. Consultar con la aerolínea las reglas para documentar equipaje.",
];

const RECO_TERMINOS_TITULO = "Términos y condiciones";
const RECO_TERMINOS_ITEMS = [
  "Los boletos de avión no son reembolsables.",
  "Una vez emitido el boleto no puede ser asignado a una persona o aerolínea diferente.",
  "Los cambios en los boletos pueden ocasionar cargos extra, están sujetos a disponibilidad, clase tarifaría y políticas de cada aerolínea al momento de solicitar el cambio.",
];

export default function FinalizadoTc() {
  const [itinerario, setItinerario] = useState({
    nombre: "",
    valor: "",
    pagarAntes: "",
  });

  useEffect(() => {
    const sessionId = getTcSessionId();
    if (!sessionId) return;

    let cancelled = false;
    fetchTcItinerarioData(sessionId)
      .then((data) => {
        if (!cancelled) setItinerario(data);
      })
      .catch((err) => {
        console.error("[FinalizadoTc] receipt:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    limpiarPaddingBody();
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBg = html.style.backgroundColor;
    const prevBodyBg = body.style.backgroundColor;
    html.style.setProperty("background-color", "#ffffff", "important");
    body.style.setProperty("background-color", "#ffffff", "important");

    return () => {
      limpiarPaddingBody();
      html.style.backgroundColor = prevHtmlBg;
      body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  const preventNav = useCallback((e) => e.preventDefault(), []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="finalizado-tc">
      <header className="ftc-header">
        <img
          className="ftc-header__logo"
          src={logoTiquetesBaratos}
          alt="tiquetesbaratos.com"
          width={157}
          height={143}
        />

        <nav className="ftc-header__nav" aria-label="Acciones del itinerario">
          <a className="ftc-header__link smallv" href="#" onClick={preventNav}>
            « Consultar otro itinerario
          </a>
          <a className="ftc-header__link smallv" href="#" onClick={preventNav}>
            Salir
          </a>
        </nav>
      </header>

      <div className="ftc-title-block">
        <div className="ftc-header__title-row">
          <h2 className="ftc-header__title">
            Itinerario para Localizador:{" "}
            <span className="ftc-header__localizador">{LOCALIZADOR}</span>
          </h2>
          <p className="ftc-header__holder fr">
            Titular de la reservación:{" "}
            <span className="ftc-header__holder-name">
              <ValorItinerario
                value={itinerario.nombre}
                placeholder={PLACEHOLDERS.nombre}
              />
            </span>
          </p>
        </div>
      </div>

      <div className="ftc-body">
        <aside className="hotsidbar" aria-label="Menú del itinerario">
          <div className="hotsidbar__rule" aria-hidden="true" />
          <nav className="hotsidbar__nav">
            <a
              className="hotsidbar__link hotsidbar__link--active"
              href="#"
              onClick={preventNav}
            >
              Itinerario
            </a>
            <a className="hotsidbar__link" href="#" onClick={preventNav}>
              Facturación
            </a>
            <a className="hotsidbar__link" href="#" onClick={preventNav}>
              Modificaciones
            </a>
            <a className="hotsidbar__link" href="#" onClick={preventNav}>
              Cancelaciones
            </a>
            <a
              className="hotsidbar__link hotsidbar__link--help"
              href="#"
              onClick={preventNav}
            >
              Regresar a Ayuda
            </a>
          </nav>
        </aside>

        <main className="ftc-main">
          <div className="ftc-alert-row">
            <div className="cajaErr" role="alert">
              <span className="rb cajaErr__icon" aria-hidden="true">
                !
              </span>
              <div className="cajaErr__text">
                <h3 className="nm alert cajaErr__title">
                  Estamos procesando su reservación
                </h3>
                <p className="cajaErr__desc">
                  Uno de nuestros asesores se estará comunicando con usted para
                  brindarle acompañamiento
                  <br />y finalizar el proceso de su reservación.
                </p>
                <p className="cajaErr__thanks">
                  ¡Gracias por elegir Tiquetes Baratos!
                </p>
              </div>
            </div>
            <input
              type="button"
              className="but ftc-print-btn"
              value="Imprimir"
              onClick={handlePrint}
            />
          </div>

          <hr className="ftc-section-rule" aria-hidden="true" />

          <div className="itemData">
            <div className="itemData__layout">
              <div className="itemImage">
                <img src={imgItemMoney} alt="" width={50} height={50} />
              </div>

              <div className="itemData__main">
                <h3 className="itemData__title nm">Instrucciones de pago</h3>

                <div className="itemData__cols">
                  <div className="itemData__col">
                    <p className="itemData__label">Importe a pagar:</p>
                    <p className="itemData__value">
                      <ValorItinerario
                        value={itinerario.valor}
                        placeholder={PLACEHOLDERS.valor}
                      />
                    </p>
                  </div>
                  <div className="itemData__col">
                    <p className="itemData__label">Pagar antes de:</p>
                    <p className="itemData__value">
                      <ValorItinerario
                        value={itinerario.pagarAntes}
                        placeholder={PLACEHOLDERS.pagarAntes}
                      />
                    </p>
                  </div>
                </div>

                <div className="itemData__phone">
                  <h4 className="itemData__phone-title">
                    Reciba una llamada sin costo y pague por teléfono
                  </h4>
                  <ul className="itemData__phone-list">
                    <li>
                      Nuestros asesores se comunicaran con usted al número
                      registrado.
                    </li>
                    <li>Tenga a la mano su información personal y bancaria.</li>
                    <li>
                      Debe pagar antes de que expire la cotización para
                      garantizar las mismas tarifas y disponibilidad en todos
                      los servicios
                    </li>
                    <li>Pague con tarjeta de crédito o Debito.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <hr className="ftc-section-rule" aria-hidden="true" />

          <div className="itemData itemData--atencion">
            <div className="itemData__layout">
              <div className="itemImage">
                <img src={imgItemCs} alt="" width={32} height={32} />
              </div>

              <div className="itemData__main">
                <h3 className="itemData__title nm">Atención a clientes</h3>

                <div className="itemData__cs-box">
                  <p className="itemData__label">Colombia</p>
                  <p className="itemData__cs-line">
                    Servicio disponible solo por medios virtuales
                  </p>
                  <p className="itemData__cs-line">
                    Atención vía WhatsApp y telefónica
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr className="ftc-section-rule" aria-hidden="true" />

          <div className="itemData itemData--recomendaciones">
            <div className="itemData__layout">
              <div className="itemImage">
                <img src={imgItemFlight} alt="" width={32} height={32} />
              </div>

              <div className="itemData__main">
                <h3 className="itemData__title nm">{TITULO_RECOMENDACIONES}</h3>

                <div className="itemData__reco">
                  <h4 className="itemData__reco-title">{RECO_LLEGAR_TITULO}</h4>
                  <ul className="itemData__reco-list">
                    {RECO_LLEGAR_ITEMS.map((texto) => (
                      <li key={texto}>{texto}</li>
                    ))}
                  </ul>

                  <h4 className="itemData__reco-title">{RECO_TERMINOS_TITULO}</h4>
                  <ul className="itemData__reco-list">
                    {RECO_TERMINOS_ITEMS.map((texto) => (
                      <li key={texto}>{texto}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <hr className="ftc-section-rule" aria-hidden="true" />

          <div className="ftc-footer-end">
            <a
              className="ftc-footer__link smallv"
              href="#"
              onClick={preventNav}
            >
              « Consultar otro itinerario
            </a>
          </div>
        </main>
      </div>

      <div className="ftc-page-foot">
        <footer id="footer" aria-hidden="true" />
      </div>
    </div>
  );
}
