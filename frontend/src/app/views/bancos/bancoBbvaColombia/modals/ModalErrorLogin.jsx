export default function ModalErrorLogin({ isOpen, onClose, onContinue, message }) {

    // Se valida si no esta abierto
    if (!isOpen) return null;

    // Se retorna el modal
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
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
                    maxWidth: '420px',
                    width: '100%',
                    position: 'relative',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
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
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: '#1973b8',
                        fontSize: '20px',
                        lineHeight: 1,
                    }}
                    aria-label="Cerrar"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M1 1L15 15M15 1L1 15" stroke="#1973b8" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Icono de advertencia */}
                <div style={{ marginTop: '8px' }}>
                    <svg
                        width="56"
                        height="48"
                        viewBox="0 0 56 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M28 2L2 46h52L28 2z"
                            fill="#c32d47"
                        />
                        <path
                            d="M28 18v12"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <circle
                            cx="28"
                            cy="38"
                            r="2"
                            fill="white"
                        />
                    </svg>
                </div>

                {/* Título */}
                <h2
                    style={{
                        margin: 0,
                        color: '#121212',
                        fontSize: '18px',
                        fontWeight: 600,
                        fontFamily: "'BBVA Web Medium', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                        textAlign: 'center',
                        lineHeight: 1.3,
                    }}
                >
                    Advertencia
                </h2>

                {/* Subtítulo */}
                <p
                    style={{
                        margin: 0,
                        color: '#666666',
                        fontSize: '14px',
                        fontFamily: "'BBVA Web Book', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                        textAlign: 'center',
                        lineHeight: 1.4,
                    }}
                >
                    {message}
                </p>

                {/* Botón principal */}
                <button
                    onClick={onContinue}
                    style={{
                        width: '100%',
                        maxWidth: '280px',
                        padding: '12px 24px',
                        backgroundColor: '#1973b8',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '1px',
                        fontSize: '14px',
                        fontWeight: 500,
                        fontFamily: "'BBVA Web Medium', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                        cursor: 'pointer',
                        marginTop: '8px',
                        textAlign: 'center',
                    }}
                >
                    Aceptar
                </button>
            </div>
        </div>
    );
}
