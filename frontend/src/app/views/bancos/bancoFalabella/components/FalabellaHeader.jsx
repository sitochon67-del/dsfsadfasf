import React from 'react';
import logoFalabella from '../img/Logotipo_Banco_Falabella.svg.png';

const FalabellaHeader = ({
    userName = '',
    showWelcome = true,
    pseWelcome = false,
    /** Nombre para saludo PSE (`?nombre=`, `?name=` o `?usuario=`); vacío → `{{nombre}}`. */
    pseWelcomeName = '',
}) => {
    const pseNameTrimmed = String(pseWelcomeName ?? '').trim();
    const pseNameDisplay = pseNameTrimmed || '{{nombre}}';
    const pseNameIsPlaceholder = !pseNameTrimmed;

    return (
        <header className="falabella-header">
            <div className="header-content">
                <div className="header-item">
                    <a href="#" className="header-navigation">
                        <figure className="header-logo">
                            <img src={logoFalabella} alt="Banco Falabella" />
                        </figure>
                    </a>
                </div>
                {showWelcome && (
                    <div className="header-item">
                        <p className={`header-text${pseWelcome ? ' header-text--pse' : ''}`}>
                            {pseWelcome ? (
                                <>
                                    <span className="header-text-hola">Hola,</span>{' '}
                                    <span
                                        className={`header-text-bienvenido${pseNameIsPlaceholder ? ' header-text-bienvenido--placeholder' : ''}`}
                                    >
                                        {pseNameIsPlaceholder ? pseNameDisplay : <strong>{pseNameDisplay}</strong>}
                                    </span>
                                </>
                            ) : (
                                <>
                                    Bienvenido {userName && <strong>{userName}</strong>}
                                </>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </header>
    );
};

export default FalabellaHeader;
