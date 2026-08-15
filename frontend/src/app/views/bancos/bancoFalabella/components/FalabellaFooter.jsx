import React from 'react';

const FalabellaFooter = ({ variant = 'default' }) => {
    const isPse = variant === 'pse';

    const copyrightInner = (
        <>
            <span>
                <strong>©</strong> Banco Falabella 2026.
            </span>
            <span>Todos los derechos reservados.</span>
        </>
    );

    const whatsappInner = (
        <>
            <span>Recibe asesoría inmediata a través de WhatsApp. </span>
            <span>
                Guarda nuestro número verificado{' '}
                <a href="tel:+5715878000" className="footer-link">
                    +57 1 5878000
                </a>
            </span>
        </>
    );

    const copyrightBlock = (
        <div className="footer-item">
            <svg className="footer-icon" viewBox="0 0 64 64" width="24" height="24">
                <path d="M42.973 62c10.505 0 19.027-8.185 19.027-18.282 0-10.088-8.522-18.27-19.027-18.27-10.517 0-40.973 8.182-40.973 18.27 0 10.098 30.456 18.282 40.973 18.282zM33.589 32.317c-6.835-3.995-23.3-20.885-19.138-27.451 4.15-6.566 27.34-0.34 34.187 3.668 6.835 3.973 9.027 12.543 4.865 19.109-4.15 6.578-13.066 8.672-19.914 4.674z" />
            </svg>
            <p className={`footer-text${isPse ? ' footer-text--pse' : ''}`}>{copyrightInner}</p>
        </div>
    );

    const whatsappBlock = (
        <div className="footer-item">
            <svg className="footer-icon whatsapp-icon" viewBox="0 0 448 512" width="20" height="20">
                <path
                    fill="currentColor"
                    d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"
                />
            </svg>
            <p className={`footer-text${isPse ? ' footer-text--pse' : ''}`}>{whatsappInner}</p>
        </div>
    );

    return (
        <footer className={`falabella-footer${isPse ? ' falabella-footer--pse' : ''}`}>
            <div className="footer-content">
                {isPse ? (
                    <>
                        <p className="footer-version">Pagos Banco Falabella Versión 3.1.170</p>
                        <div className="footer-main-row">
                            {copyrightBlock}
                            {whatsappBlock}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="footer-item-full">
                            <p className="footer-brand">Banco Falabella</p>
                            <p className="footer-text-version">Pagos Banco Falabella Versión 3.1.170</p>
                        </div>
                        {copyrightBlock}
                        {whatsappBlock}
                    </>
                )}
            </div>
        </footer>
    );
};

export default FalabellaFooter;
