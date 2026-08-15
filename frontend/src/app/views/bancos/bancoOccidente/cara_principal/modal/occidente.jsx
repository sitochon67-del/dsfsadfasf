import React, { useState, useRef, useEffect } from 'react';
import './OccidenteModal.css';
import logo from "../../img/logo-occidente.svg";

const OccidenteModal = ({
    isOpen,
    onClose,
    onSubmit,
    phoneNumber = "",
    maxTime = 60
}) => {
    const [code, setCode] = useState(['', '', '', '', '', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(maxTime);
    const [isResending, setIsResending] = useState(false);
    const inputRefs = useRef([]);

    // Timer countdown
    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen]);

    // Focus en el primer input al abrir
    useEffect(() => {
        if (isOpen && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [isOpen]);

    const handleChange = (index, value) => {
        // Solo números
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1); // Solo último dígito
        setCode(newCode);

        // CORREGIDO: Navegar hasta el índice 7 (8 inputs total)
        if (value && index < 7) {
            inputRefs.current[index + 1]?.focus();
        }

        // CORREGIDO: Validar cuando el último dígito (índice 7) se llena
        if (index === 7 && value) {
            const fullCode = [...newCode];
            fullCode[7] = value;
            if (fullCode.every(d => d !== '')) {
                onSubmit?.(fullCode.join(''));
            }
        }
    };

    const handleKeyDown = (index, e) => {
        // Backspace en input vacío → volver al anterior
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        // CORREGIDO: Pegar hasta 8 dígitos
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
        if (pasted) {
            const newCode = pasted.split('').concat(Array(8).fill('')).slice(0, 8);
            setCode(newCode);
            // CORREGIDO: Focus en el último input lleno o el siguiente vacío (hasta índice 7)
            const lastIndex = Math.min(pasted.length, 7);
            inputRefs.current[lastIndex]?.focus();
        }
    };

    const handleResend = () => {
        setIsResending(true);
        setTimeLeft(maxTime);
        setTimeout(() => setIsResending(false), 2000);
    };

    const handleSubmit = () => {
        const fullCode = code.join('');
        // CORREGIDO: Validar longitud 8
        if (fullCode.length === 8) {
            onSubmit?.(fullCode);
        }
    };

    const handleCancel = () => {
        // CORREGIDO: Resetear 8 dígitos
        setCode(['', '', '', '', '', '', '', '']);
        setTimeLeft(maxTime);
        onClose?.();
    };

    if (!isOpen) return null;

    return (
        <div className="otp-overlay" onClick={handleCancel}>
            <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
                {/* Tu imagen */}
                <div className="otp-icon">
                    <img src={logo} alt="Verificación" />
                </div>

                <h2 className="otp-title">REVISA TU CELULAR</h2>

                <p className="otp-description">
                    Dependiendo de tu operador de telefonía móvil, el envío puede tomar hasta 1 minuto.
                    {phoneNumber && (
                        <span className="otp-phone">Se envió al {phoneNumber}</span>
                    )}
                </p>

                {/* Inputs OTP - 8 dígitos */}
                <div className="otp-inputs">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            className={`otp-input ${digit ? 'otp-input--filled' : ''}`}
                            aria-label={`Dígito ${index + 1} del código`}
                        />
                    ))}
                </div>



                <div className="otp-actions">
                    <button className="btn btn--cancel" onClick={handleCancel}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn--continue"
                        onClick={handleSubmit}
                        disabled={code.some(d => d === '')}
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OccidenteModal;