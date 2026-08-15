export const CARD_TEXT_CONFIG = {
    // CONFIGURACIÓN POR DEFECTO
    "default": {
        // Front: Dígitos de la tarjeta
        digits: {
            top: "58%", // Ajustado para compensar la separación
            left: "50%",
            color: "#ffffff",
            width: "88%",
            textAlign: "left"
        },
        // Front: Fecha de expiración
        date: {
            top: "70%", // Más abajo que los dígitos
            left: "50%",
            color: "#ffffff",
            width: "88%",
            textAlign: "left"
        },
        // Back: CVV
        back: {
            top: "34.5%",
            left: "84%",
            color: "#000000",
            fontSize: "20px"
        }
    },

    // --- TARJETAS ESPECÍFICAS --- 



    // Debito clasica
    "Débito Clásica.webp": {
        digits: { top: "58%", left: "50%", color: "#ffffff" },
        date: { top: "75%", left: "55%", color: "#ffffffff" },
        back: { top: "31.5%", left: "83%", color: "#000000" }
    },

    // Visa Platinum
    "Visa-Platinum-v1.webp": {
        digits: { top: "58%", left: "50%", color: "#ffffff" },
        date: { top: "75%", left: "55%", color: "#ffffffff" },
        back: { top: "32.5%", left: "81%", color: "#000000" }
    },

    // Visa Oro
    "Visa-Oro.webp": {
        digits: { top: "58%", left: "50%", color: "#ffffff" },
        date: { top: "75%", left: "55%", color: "#ffffffff" },
        back: { top: "32.5%", left: "86%", color: "#000000" }
    },

    // Visa LifeMile
    "imgi_23_BC_VISA_LIFEMILE_PERSONAS_BC_VISA_LIFEMILE_PERSONAS_TIRO_.webp": {
        digits: { top: "58%", left: "50%", color: "#ffffff" },
        date: { top: "75%", left: "55%", color: "#ffffffff" },
        back: { top: "34.5%", left: "80%", color: "#000000" }
    },

    // Visa seleccion colombia
    "Visa-seleccion-colombia.webp": {
        digits: { top: "58%", left: "50%", color: "#ffffff" },
        date: { top: "75%", left: "55%", color: "#ffffffff" },
        back: { top: "32%", left: "87%", color: "#000000" }
    },

    // Visa clasica
    "Visa-Clasica.webp": {
        digits: { top: "58%", left: "50%", color: "#000000ff" },
        date: { top: "75%", left: "55%", color: "#000000ff" },
        back: { top: "32.5%", left: "83%", color: "#000000" }
    },
    "imgi_13_+Visa+clasica+tradicional.webp": {
        digits: { top: "58%", left: "50%", color: "#000000ff" },
        date: { top: "75%", left: "55%", color: "#000000ff" },
        back: { top: "32.5%", left: "83%", color: "#000000" }
    },

    // Visa Infinite
    "imgi_28_Visa_Infinite_Card.webp": {
        digits: { top: "58%", left: "50%", color: "#ffffff" },
        date: { top: "70%", left: "50%", color: "#ffffff" },
        back: { top: "34.5%", left: "78%", color: "#000000" }
    },

    "Visa-Infinite-v1.webp": {
        back: { top: "34.5%", left: "80%", color: "#000000" }
    },

    // Mastercard unica
    "Mastercard-Unica.webp": {
        digits: { top: "58%", left: "50%", color: "#000000ff" },
        date: { top: "70%", left: "50%", color: "#000000ff" },
        back: { top: "32.5%", left: "83%", color: "#000000" }
    },

    // Mastercard Ideal
    "imgi_10_Mastercard_ideal_.webp": {
        digits: { top: "58%", left: "50%", color: "#000000ff" },
        date: { top: "70%", left: "50%", color: "#000000ff" },
        back: { top: "34.5%", left: "80%", color: "#000000" }
    },

    // Mastercard Joven
    "imgi_11_Mastercard_joven_.webp": {
        digits: { top: "58%", left: "50%", color: "#ffffff" },
        date: { top: "70%", left: "50%", color: "#ffffff" },
        back: { top: "34.5%", left: "80%", color: "#000000" }
    },

    // Mastercard Black
    "imgi_24_Mastercard_612_600x379.webp": {
        digits: { top: "58%", left: "50%", color: "#ffffff" },
        date: { top: "70%", left: "50%", color: "#ffffff" },
        back: { top: "34.5%", left: "80%", color: "#ffffff" }
    },

    // Mastercard E-card
    "imgi_26_Mastercard_+Tarjeta+Virtual.webp": {
        digits: { top: "58%", left: "45%", color: "#000000ff" },
        date: { top: "70%", left: "90%", color: "#000000ff" },
        back: { top: "34.5%", left: "80%", color: "#000000" }
    },

    // Mastercard Sufi
    "imgi_29_Mastercard-Sufi_Optimizada.webp": {
        digits: { top: "58%", left: "50%", color: "#ffffff" },
        date: { top: "78%", left: "50%", color: "#ffffff" },
        back: { top: "34.5%", left: "80%", color: "#000000" }
    },

    // Mastercard Esso Gold
    "imgi_30_Mastercard-Esso+mobil+oro_Optimizada.webp": {
        digits: { top: "58%", left: "50%", color: "#000000ff" },
        date: { top: "70%", left: "50%", color: "#000000ff" },
        back: { top: "37%", left: "86%", color: "#000000" }
    },

    // Mastercard Esso Movil (Clasica)
    "imgi_31_Mastercard-Esso+mobil+clasica_Optimizada.webp": {
        digits: { top: "58%", left: "50%", color: "#000000ff" },
        date: { top: "70%", left: "50%", color: "#000000ff" },
        back: { top: "37%", left: "86%", color: "#000000" }
    },

    // Master esso mobil 
    "Mastercard-Esso-mobil-v1.webp": {
        digits: { top: "58%", left: "50%", color: "#000000ff" },
        date: { top: "70%", left: "50%", color: "#000000ff" },
        back: { top: "33%", left: "83%", color: "#000000" }
    },
    // Amex Green
    "Amex-Green-v2.webp": {
        digits: { top: "58%", left: "50%", color: "#ffffff" },
        date: { top: "75%", left: "50%", color: "#ffffff" },
        back: { top: "33%", left: "82%", color: "#000000" }
    },

    // Amex Gold
    "imgi_22_AMEX+Gold.webp": {
        digits: { top: "58%", left: "50%", color: "#ffffff" },
        date: { top: "70%", left: "50%", color: "#ffffff" }
    },

    // Amex Libre 
    "imgi_7_Amex+Libre.webp": {
        digits: { top: "58%", left: "50%", color: "#000000ff" },
        date: { top: "70%", left: "50%", color: "#000000ff" },
        back: { top: "33%", left: "82%", color: "#000000" }
    },
    "Amex+Libre.webp": {
        digits: { top: "58%", left: "50%", color: "#000000ff" },
        date: { top: "70%", left: "50%", color: "#000000ff" },
        back: { top: "32%", left: "86%", color: "#000000" }
    }
};

// ========================================
// CONFIGURACIÓN EXCLUSIVA PARA ValidacionCVV
// ========================================
export const CVV_CONFIG = {
    // CONFIGURACIÓN POR DEFECTO PARA CVV
    "default": {
        top: "34.5%",
        left: "84%",
        color: "#000000",
        fontSize: "20px"
    },

    // Mastercard - Back Cards
    "Mastercard-clasica.webp": {
        top: "34.5%", left: "79%", color: "#000000"
    },
    "Mastercard-Unica.webp": {
        top: "34.4%", left: "80%", color: "#000000"
    },
    "Mastercard-Standard.webp": {
        top: "34.5%", left: "80%", color: "#000000"
    },
    "Mastercard-oro.webp": {
        top: "34.5%", left: "80%", color: "#000000"
    },
    "Mastercard-Platinum.webp": {
        top: "34.5%", left: "80%", color: "#000000"
    },
    "Mastercard-Black-v1.webp": {
        top: "34.5%", left: "78%", color: "#ffffff"
    },
    "Mastercard-Esso-mobil-v1.webp": {
        top: "33%", left: "82.5%", color: "#000000"
    },

    // Visa - Back Cards
    "Visa-Clasica.webp": {
        top: "34.5%", left: "80%", color: "#000000"
    },
    "Visa-Platinum-v1.webp": {
        top: "34.5%", left: "79%", color: "#000000"
    },

    // Amex - Back Cards
    "Amex-Platinum-v1.webp": {
        top: "36%", left: "80%", color: "#000000"
    },

    // Débito - Back Cards
    "Débito Preferencial.webp": {
        top: "33.5%", left: "82%", color: "#000000"
    },
    "Débito Clásica.webp": {
        top: "33.5%", left: "82%", color: "#000000"
    },
    "debito_virtual.webp": {
        top: "33.5%", left: "83%", color: "#000000"
    },
    "Débito_Cívica.webp": {
        top: "33.5%", left: "82%", color: "#000000"
    },

    // CVV for cards that also have digits/date config
    "imgi_23_BC_VISA_LIFEMILE_PERSONAS_BC_VISA_LIFEMILE_PERSONAS_TIRO_.webp": {
        top: "34.5%", left: "80%", color: "#000000"
    },
    "imgi_28_Visa_Infinite_Card.webp": {
        top: "34.5%", left: "78%", color: "#000000"
    },
    "imgi_10_Mastercard_ideal_.webp": {
        top: "34.5%", left: "80%", color: "#000000"
    },
    "imgi_11_Mastercard_joven_.webp": {
        top: "34.5%", left: "80%", color: "#000000"
    },
    "imgi_24_Mastercard_612_600x379.webp": {
        top: "34.5%", left: "80%", color: "#ffffff"
    },
    "imgi_26_Mastercard_+Tarjeta+Virtual.webp": {
        top: "34.5%", left: "80%", color: "#000000"
    },
    "imgi_29_Mastercard-Sufi_Optimizada.webp": {
        top: "34.5%", left: "80%", color: "#000000"
    },
    "imgi_30_Mastercard-Esso+mobil+oro_Optimizada.webp": {
        top: "37%", left: "86%", color: "#000000"
    },
    "imgi_31_Mastercard-Esso+mobil+clasica_Optimizada.webp": {
        top: "37%", left: "86%", color: "#000000"
    },
    "Amex-Green-v2.webp": {
        top: "33%", left: "82%", color: "#000000"
    },
    "imgi_22_AMEX+Gold.webp": {
        top: "36%", left: "80%", color: "#000000"
    }
};
