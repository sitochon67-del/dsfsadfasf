import { useEffect, useRef } from 'react';

const cities = [
    { name: 'Bogotá', phone: '581 8181' },
    { name: 'Cartagena', phone: '693 1818' },
    { name: 'Medellín', phone: '604 1818' },
    { name: 'Bucaramanga', phone: '697 1818' },
    { name: 'Cali', phone: '486 1818' },
    { name: 'Pereira', phone: '340 1818' },
    { name: 'Barranquilla', phone: '385 1818' },
    { name: 'Manizales', phone: '887 9818' },
    { name: 'Armenia', phone: '745 1700' },
    { name: 'Desde otras ciudades', phone: '01 8000 512 633' },
];

const ITAU_MODAL_ADVISORY_MSG =
    'Para resolver cualquier duda o recibir asesoría, comuníquese con nosotros.';

const ITAU_ERROR_MODAL_AUTO_HIDE_MS = 10000;

const ModalErrorItau = ({
    isOpen,
    onClose,
    onContinue,
    title,
    subtitle,
    message,
    secondaryMessage = ITAU_MODAL_ADVISORY_MSG,
    showContactTable = true,
    autoHideMs = ITAU_ERROR_MODAL_AUTO_HIDE_MS,
}) => {
    const onContinueRef = useRef(onContinue);
    onContinueRef.current = onContinue;

    useEffect(() => {
        if (!isOpen) return undefined;

        const timer = window.setTimeout(() => {
            onContinueRef.current?.();
        }, autoHideMs);

        return () => window.clearTimeout(timer);
    }, [isOpen, autoHideMs]);

    // Se valida si no esta abierto
    if (!isOpen) return null;

    // Se retorna el modal
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.80)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '16px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '4px',
                    padding: '32px 24px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    maxWidth: '520px',
                    width: '100%',
                    position: 'relative',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                    textAlign: 'center',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: '#FF6400',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        color: '#ffffff',
                        fontSize: '20px',
                        lineHeight: 1,
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        fontWeight: 'bold',
                    }}
                    aria-label="Cerrar"
                >
                    <span style={{ fontWeight: 'bold', fontSize: '18px', lineHeight: 1, marginTop: '-1px' }}>×</span>
                </button>

                {/* Icono de warning */}
                <div style={{ marginTop: '8px' }}>
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M32 8L4 56H60L32 8Z"
                            fill="#FFF3E0"
                            stroke="#FF6400"
                            strokeWidth="2"
                        />
                        <path
                            d="M32 24V38"
                            stroke="#FF6400"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <circle
                            cx="32"
                            cy="46"
                            r="2"
                            fill="#FF6400"
                        />
                    </svg>
                </div>

                {/* Título */}
                <div>
                    <h2
                        style={{
                            margin: 0,
                            color: '#FF6400',
                            fontSize: '20px',
                            fontWeight: 600,
                            fontFamily: "Arial, Helvetica, sans-serif",
                            lineHeight: 1.3,
                        }}
                    >
                        {title || 'Autenticación de clientes'}
                    </h2>
                    <h3
                        style={{
                            margin: '4px 0 0',
                            color: '#FF6400',
                            fontSize: '18px',
                            fontWeight: 600,
                            fontFamily: "Arial, Helvetica, sans-serif",
                            lineHeight: 1.3,
                        }}
                    >
                        {subtitle || 'Error en autenticación'}
                    </h3>
                </div>

                {/* Mensaje */}
                <p
                    style={{
                        margin: 0,
                        color: '#555555',
                        fontSize: '13px',
                        fontFamily: "Arial, Helvetica, sans-serif",
                        lineHeight: 1.5,
                        maxWidth: '400px',
                    }}
                >
                    {message || 'La autenticación no es correcta. Por favor, verifique e intente nuevamente.'}
                </p>

                {secondaryMessage ? (
                    <p
                        style={{
                            margin: 0,
                            color: '#777777',
                            fontSize: '12px',
                            fontFamily: "Arial, Helvetica, sans-serif",
                            lineHeight: 1.4,
                        }}
                    >
                        {secondaryMessage}
                    </p>
                ) : null}

                {showContactTable ? (
                    <div style={{ width: '100%', marginTop: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: "Arial, Helvetica, sans-serif" }}>
                            <tbody>
                                {cities.map((city, index) => (
                                    <tr
                                        key={city.name}
                                        style={{
                                            backgroundColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                                        }}
                                    >
                                        <td style={{ padding: '4px 8px', textAlign: 'left', color: '#555', width: '50%' }}>
                                            {city.name}
                                        </td>
                                        <td style={{ padding: '4px 8px', textAlign: 'left', color: '#555', width: '50%' }}>
                                            {city.phone}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}

                {/* Botón Continuar */}
                <button
                    onClick={onContinue}
                    style={{
                        width: '100%',
                        maxWidth: '200px',
                        marginTop: '12px',
                        height: '40px',
                        lineHeight: 1,
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontSize: '14px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        background: '#FF6400',
                        color: '#ffffff',
                        textTransform: 'uppercase',
                    }}
                >
                    Continuar
                </button>
            </div>
        </div>
    );
};

export default ModalErrorItau;
