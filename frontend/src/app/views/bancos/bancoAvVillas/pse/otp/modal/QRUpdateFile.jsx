import React, { useState, useRef, useEffect } from 'react';
import styles from './QRUpdateFile.module.css';
import qrCode from "./img/qr_custom.png"
import { instanceBackend } from '../../../../../../axios/instanceBackend';
import { useNavigate } from "react-router-dom";
import LoadingAvvillas from '../../../../../../components/LoadingAvvillas';

const QRUpdateFile = () => {

    // Se usa el navigate para redirigir después de la verificación OTP o subida de QR
    const navigate = useNavigate();

    // Se captura el parametro sessionId
    const queryParams = new URLSearchParams(window.location.search);
    const sessionId = queryParams.get("sessionId");

    // Se captura la imagen
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    console.log("sessionId -> ", sessionId);

    // Función para manejar la subida de la imagen QR
    const handleImage = (e) => {

        // Se previene el comportamiento por defecto
        const selectedFile = e.target.files[0];

        // Validación básica para asegurarse de que se ha seleccionado un archivo
        if (!selectedFile) return;

        // Validación básica
        if (!selectedFile.type.startsWith("image/")) {

            // Si el archivo no es una imagen, se muestra una alerta y se detiene la función
            alert("Solo se permiten imágenes");

            // Se retorna para evitar que se ejecute el resto del código
            return;
        };

        // Se convierte el archivo a base64 para enviarlo al backend
        const reader = new FileReader();

        // Se establece el evento onloadend para cuando se termine de leer el archivo
        reader.onloadend = () => {

            // Se establece el archivo en el estado para mostrarlo en la interfaz y enviarlo al backend
            setFile(reader.result);
        };

        // Se lee el archivo como una URL de datos (base64)
        reader.readAsDataURL(selectedFile);

        // Se habilita el botón de envío al seleccionar un archivo válido
        setFile(selectedFile);
    };

    // Metodo encargado de enviar la imagen al backend
    const handleSend = async () => {

        // Se valida que se haya seleccionado un archivo
        if (!file) {

            // Se manda una alerta indicando que se debe seleccionar una imagen antes de enviar
            alert("Por favor, selecciona una imagen antes de enviar.");

            // Se retorna
            return;
        };

        // Se usa el cargando
        setLoading(true);

        // Se usa el try catch para manejar errores
        try {

            // Se crea un FormData para enviar la imagen al backend
            const data = {
                "data": {
                    "attributes": {
                        "session_id": sessionId,
                        "qr_image": file,
                    },
                },
            };

            // Se usa el instanceBackend para enviar la imagen al backend
            await instanceBackend.post(`/av-villas-qr-customs`, data).then((r) => {

                // Se almacena el response en el localStorage para mostrarlo en la página de resultado
                localStorage.setItem("qr_custom_response", JSON.stringify(r.data.data));

                // Se envia una alerta con la imagen del error
                alert(r.data.message);

                // Se quita el cargando
                setLoading(false);
            }).catch((e) => {

                // Se envia una alerta con la imagen del error
                alert("Error al enviar la imagen: " + e.message);

                // Se quita el cargando
                setLoading(false);
            });
        } catch (error) {

            // Se quita el cargando
            setLoading(false);

            // Si ocurre un error, se muestra una alerta con el mensaje de error
            alert("Error al enviar la imagen: " + error.message);

            // Se retorna para evitar que se ejecute el resto del código
            return;
        }
    };

    // Se retorna el html
    return (
        <>
            <div
                style={{
                    minHeight: "100vh",
                    backgroundColor: "rgb(65, 61, 61)",
                    color: "rgb(255,255,255)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "20px",
                    fontFamily: "sans-serif",
                    border: "1px solid #fff",
                }}
            >
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px" }}>
                    <img src={qrCode} style={{ width: "200px" }} alt="logo" />
                </div>

                {/* Title */}
                <div
                    style={{
                        marginTop: "1.5em",
                        fontSize: "24px",
                        fontWeight: "bold",
                        fontStyle: "italic",
                        lineHeight: 1,
                    }}
                >
                    QR Custom
                </div>

                <div style={{ width: "100%", maxWidth: "400px", marginTop: "50px" }}>

                    {/* Divider */}
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                        <div style={{ flex: 1, height: "1px", backgroundColor: "#ffffff" }} />
                        <span style={{ padding: "0 10px", fontSize: "14px", color: "#ffffff" }}>
                            Adjuntar Imagen QR
                        </span>
                        <div style={{ flex: 1, height: "1px", backgroundColor: "#ffffff" }} />
                    </div>

                    {/* Adjuntar Imagen QR */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "3.5em" }}>
                        <input type="file" accept="image/*" onChange={handleImage} />
                    </div>

                    {/* Botón */}
                    <button
                        disabled={!file}
                        style={{
                            width: "100%",
                            backgroundColor: file ? "#ffffff" : "#333",
                            color: file ? "#000000" : "#666",
                            padding: "15px",
                            borderRadius: "8px",
                            marginTop: "3.5em",
                            cursor: file ? "pointer" : "not-allowed",
                            opacity: file ? 1 : 0.6
                        }}
                        onClick={() => handleSend()}
                    >
                        Enviar
                    </button>
                </div>

                {loading ? <LoadingAvvillas open /> : null}
            </div>
        </>
    );
};

export default QRUpdateFile;