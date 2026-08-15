import SecurityCarousel from './SecurityCarousel';
import '../css/PromoCard.css';

function PromoCard() {
  return (
    <div className="promo-card">
      <div className="promo-icon">
        <svg className="promo-icon-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00A4E4" />
              <stop offset="100%" stopColor="#004481" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="12" fill="url(#blueGradient)" />
          <circle cx="32" cy="24" r="8" fill="white" fillOpacity="0.9" />
          <rect x="20" y="36" width="24" height="16" rx="3" fill="white" fillOpacity="0.9" />
          <rect x="24" y="40" width="16" height="2" rx="1" fill="#004481" />
          <rect x="24" y="44" width="12" height="2" rx="1" fill="#004481" />
        </svg>
      </div>

      <h2 className="promo-title">Empieza, hoy con BBVA Net</h2>

      <p className="promo-description">
        Regístrate para consultar tus productos en línea. Luego Podrás activar tu App BBVA si la necesitas.
      </p>

      <button className="register-button">Regístrate</button>

      <SecurityCarousel />
    </div>
  );
}
export default PromoCard;