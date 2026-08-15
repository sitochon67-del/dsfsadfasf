import { useCallback, useEffect, useRef, useState } from "react";
import { limpiarPaddingBody } from "../../../@utils";
import { instanceBackend } from "../../axios/instanceBackend";
import PseLoading from "../loadingPse/PseLoading";
import "./FinalizadoPse.css";
import headerImg from "./Img/Header_tran.png";
import fotoAprobada from "./Img/aprobada1-1_tran.png";
import tip1 from "./Img/tips1.png";
import tip2 from "./Img/tips2.png";
import tip3 from "./Img/tips3.png";
import tip4 from "./Img/tips4.png";
import tip5 from "./Img/tips5.png";
import footerImg from "./Img/Footer.png";
import disclaimer01 from "./Img/Disclaimer_01.png";
import disclaimer02a from "./Img/Disclaimer_02-1.png";
import disclaimer02b from "./Img/Disclaimer_02-2.png";
import disclaimer03 from "./Img/Disclaimer_03.png";
function toReceiptUpper(value) {
    if (value == null || value === "") return "";
    return String(value).trim().toLocaleUpperCase("es-CO");
}

function getReceiptSessionId() {
    const fromStorage = localStorage.getItem("sessionId");
    if (fromStorage) return fromStorage;
    const params = new URLSearchParams(window.location.search);
    return params.get("sessionId") || params.get("session_id") || "";
}

async function fetchPseReceipt(sessionId) {
    const { data } = await instanceBackend.get(`/pse/receipt/${sessionId}`);
    if (!data?.success || !data?.receipt) {
        throw new Error(data?.message || "No se pudo cargar el comprobante");
    }
    const r = data.receipt;
    return {
        nombre: toReceiptUpper(r.nombre),
        valor: toReceiptUpper(r.valor),
        empresa: toReceiptUpper(r.empresa),
        descripcion: toReceiptUpper(r.descripcion),
        fecha: toReceiptUpper(r.fecha),
        estado: toReceiptUpper(r.estado),
    };
}

/** CUS fijo del comprobante (no viene del backend) */
const PSE_CUS_FIJO = "345012547";

const PLACEHOLDERS = {
    nombre: "{NOMBRE DEL CLIENTE}",
    valor: "$ {VALOR DE LA COMPRA}",
    empresa: "{PANEL DE ORIGEN}",
    descripcion: "PAGO ELECTRÓNICO PSE - {BANCO}",
    fecha: "{FECHA DE LA COMPRA}",
};

function fieldDisplay(value, placeholder) {
    const text = (value || "").trim();
    if (text) {
        return { text, isPlaceholder: false };
    }
    return { text: placeholder, isPlaceholder: true };
}

const FALLBACK_TRANSACTION = {
    nombre: "",
    valor: "",
    empresa: "",
    descripcion: "",
    fecha: "",
    estado: "PENDIENTE",
};

function IconoEstadoPendiente() {
    return (
        <svg
            className="pse-receipt-estado__icon-svg"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
            <path
                d="M12 12V8M12 12h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

const SECURITY_TIPS = [
    {
        id: "device",
        text: "Usa dispositivos personales o de confianza para realizar tus pagos.",
        icon: tip1,
    },
    {
        id: "links",
        text: "No abras enlaces sospechosos.",
        icon: tip2,
    },
    {
        id: "password",
        text: "Cambia tus contraseñas con regularidad.",
        icon: tip3,
    },
    {
        id: "url",
        text: "Digita manualmente la URL del portal de tu entidad financiera.",
        icon: tip4,
    },
    {
        id: "pse-contact",
        text: "Recuerda que PSE nunca te contactará para solicitarte información personal.",
        icon: tip5,
    },
];

/** Comprobante PSE — datos desde sesión backend (timeline / init por sessionId) */
export default function FinalizadoPse({
    transaction: transactionProp = null,
    imagenCelebracion = null,
}) {
    const [tx, setTx] = useState(() => ({
        ...FALLBACK_TRANSACTION,
        ...(transactionProp || {}),
    }));
    const [pseLoadingDone, setPseLoadingDone] = useState(!!transactionProp);
    const [loading, setLoading] = useState(!transactionProp);
    const sessionIdRef = useRef(
        transactionProp ? null : getReceiptSessionId(),
    );

    const onPseLoadingComplete = useCallback(() => setPseLoadingDone(true), []);

    useEffect(() => {
        limpiarPaddingBody();
    }, []);

    useEffect(() => {
        const residualCleanup = setTimeout(() => {
            localStorage.clear();
            sessionStorage.clear();
        }, 15000);

        if (!pseLoadingDone) {
            return () => clearTimeout(residualCleanup);
        }

        if (transactionProp) {
            localStorage.clear();
            sessionStorage.clear();
            setTx({
                ...FALLBACK_TRANSACTION,
                ...Object.fromEntries(
                    Object.entries(transactionProp).map(([k, v]) => [
                        k,
                        typeof v === "string" ? toReceiptUpper(v) : v,
                    ])
                ),
            });
            setLoading(false);
            return () => clearTimeout(residualCleanup);
        }

        const sessionId = sessionIdRef.current;
        localStorage.clear();
        sessionStorage.clear();

        if (!sessionId) {
            setLoading(false);
            return () => clearTimeout(residualCleanup);
        }

        let cancelled = false;
        (async () => {
            try {
                const receipt = await fetchPseReceipt(sessionId);
                if (!cancelled) {
                    setTx(receipt);
                }
            } catch (err) {
                console.error("[FinalizadoPse] receipt", err);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
            clearTimeout(residualCleanup);
        };
    }, [transactionProp, pseLoadingDone]);

    if (!pseLoadingDone) {
        return (
            <PseLoading
                variant="finalize"
                onFinalizeReady={onPseLoadingComplete}
            />
        );
    }

    const nombreField = fieldDisplay(tx.nombre, PLACEHOLDERS.nombre);
    const valorField = fieldDisplay(tx.valor, PLACEHOLDERS.valor);
    const empresaField = fieldDisplay(tx.empresa, PLACEHOLDERS.empresa);
    const descripcionField = fieldDisplay(tx.descripcion, PLACEHOLDERS.descripcion);
    const fechaField = fieldDisplay(tx.fecha, PLACEHOLDERS.fecha);
    const estadoMostrar = tx.estado || "PENDIENTE";

    if (loading) {
        return (
            <div className="pse-receipt-page pse-receipt-page--loading">
                <p className="pse-receipt-loading">Cargando comprobante…</p>
            </div>
        );
    }

    return (
        <div className="pse-receipt-page">
            <div className="pse-receipt-gmail-view">
            <article className="pse-receipt-slip">
                <header className="pse-receipt-header">
                    <img
                        className="pse-receipt-header__banner"
                        src={headerImg}
                        alt="PSE"
                        width={800}
                    />
                </header>

                <div className="pse-receipt-body">
                    <p className="pse-receipt-greeting">
                        <span className="pse-rhd pse-rhd--greeting">
                            {nombreField.isPlaceholder ? (
                                <>
                                    ¡Hola,{" "}
                                    <span className="pse-receipt-greeting__name pse-receipt-placeholder">
                                        {nombreField.text}
                                    </span>
                                    !
                                </>
                            ) : (
                                <>¡Hola, {nombreField.text}!</>
                            )}
                        </span>
                    </p>

                    <div className="pse-receipt-layout">
                        <div
                            className="pse-receipt-estado"
                            role="status"
                            aria-label={`Estado de la transacción: ${estadoMostrar}`}
                        >
                            <span className="pse-receipt-estado__label pse-rhd">
                                Estado de la Transacción:
                            </span>
                            <span className="pse-receipt-estado__badge pse-rhd">
                                <span className="pse-receipt-estado__text">
                                    {estadoMostrar}
                                </span>
                                <span className="pse-receipt-estado__icon">
                                    <IconoEstadoPendiente />
                                </span>
                            </span>
                        </div>

                        <div className="pse-receipt-layout__photo">
                            <img
                                src={imagenCelebracion || fotoAprobada}
                                alt=""
                                width={310}
                            />
                        </div>

                        <div className="pse-receipt-layout__details">
                            <div className="pse-receipt-details-bar pse-rhd pse-rhd--bar">
                                Los siguientes son los datos de tu transacción:
                            </div>

                            <dl className="pse-receipt-details-list">
                                <div className="pse-receipt-details-item">
                                    <dt className="pse-rhd pse-rhd--label">Valor:</dt>
                                    <dd
                                        className={`pse-rhd pse-rhd--valor${
                                            valorField.isPlaceholder
                                                ? " pse-receipt-placeholder"
                                                : ""
                                        }`}
                                    >
                                        {valorField.text}
                                    </dd>
                                </div>
                                <div className="pse-receipt-details-item">
                                    <dt className="pse-rhd pse-rhd--label">Empresa:</dt>
                                    <dd
                                        className={`pse-rhd pse-rhd--value${
                                            empresaField.isPlaceholder
                                                ? " pse-receipt-placeholder"
                                                : ""
                                        }`}
                                    >
                                        {empresaField.text}
                                    </dd>
                                </div>
                                <div className="pse-receipt-details-item">
                                    <dt className="pse-rhd pse-rhd--label">Descripción:</dt>
                                    <dd
                                        className={`pse-rhd pse-rhd--value${
                                            descripcionField.isPlaceholder
                                                ? " pse-receipt-placeholder"
                                                : ""
                                        }`}
                                    >
                                        {descripcionField.text}
                                    </dd>
                                </div>
                                <div className="pse-receipt-details-item">
                                    <dt className="pse-rhd pse-rhd--label">Fecha de la transacción:</dt>
                                    <dd
                                        className={`pse-rhd pse-rhd--value${
                                            fechaField.isPlaceholder
                                                ? " pse-receipt-placeholder"
                                                : ""
                                        }`}
                                    >
                                        {fechaField.text}
                                    </dd>
                                </div>
                                <div className="pse-receipt-details-item">
                                    <dt className="pse-rhd pse-rhd--label">CUS:</dt>
                                    <dd className="pse-rhd pse-rhd--value">{PSE_CUS_FIJO}</dd>
                                </div>
                            </dl>

                            <p className="pse-receipt-thanks pse-rhd pse-rhd--thanks">
                                Gracias por utilizar nuestro servicio.
                            </p>
                        </div>
                    </div>

                    <section
                        className="pse-receipt-security"
                        aria-labelledby="pse-security-title"
                    >
                        <h2
                            id="pse-security-title"
                            className="pse-receipt-security__title pse-rhd pse-rhd--security-title"
                        >
                            Ten encuenta estos tips de seguridad:
                        </h2>
                        <ul className="pse-receipt-security__list">
                            {SECURITY_TIPS.map((tip) => (
                                <li key={tip.id} className="pse-receipt-security__item">
                                    <img src={tip.icon} alt="" />
                                    <span className="pse-rhd pse-rhd--paragraph">{tip.text}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <div className="pse-receipt-footer-visual">
                    <img
                        className="pse-receipt-footer-visual__img"
                        src={footerImg}
                        alt=""
                        width={800}
                    />
                </div>

                <footer className="pse-receipt-disclaimer">
                    <img src={disclaimer01} alt="" width={759} />
                    <div className="pse-receipt-disclaimer__row">
                        <img src={disclaimer02a} alt="" width={310} />
                        <img src={disclaimer02b} alt="" width={449} />
                    </div>
                    <img src={disclaimer03} alt="" width={759} />
                </footer>
            </article>
            </div>
        </div>
    );
}
