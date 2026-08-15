import './ModalErrorLoginPopular.css';

export default function ModalErrorLoginPopular({
    message = 'Las credenciales ingresadas no son válidas. Verifica e intenta nuevamente.',
    isOpen = true,
    onClose,
    variant = 'fixed',
}) {
    if (variant === 'fixed' && !isOpen) {
        return null;
    }

    return (
        <div
            className={`popular-error-banner popular-error-banner--${variant} ${
                variant === 'fixed' && isOpen ? 'open' : ''
            }`}
            role="alert"
        >
            <div className="popular-error-banner__container">
                <div className="popular-error-banner__bar" aria-hidden="true" />

                <div className="popular-error-banner__icon-wrap" aria-hidden="true">
                    <div className="popular-error-banner__icon" />
                </div>

                <div className="popular-error-banner__content">
                    <span className="popular-error-banner__message">{message}</span>
                </div>

                <button
                    type="button"
                    className="popular-error-banner__close"
                    aria-label="Cerrar notificación"
                    onClick={onClose}
                >
                    <i className="popular-error-banner__close-icon" />
                </button>
            </div>
        </div>
    );
}
