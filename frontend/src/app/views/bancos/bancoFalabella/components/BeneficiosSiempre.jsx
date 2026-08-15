import React from 'react';
import '../css/BeneficiosSiempre.css';

// Iconos SVG
const ArrowLeftRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 3 4 4-4 4"></path>
    <path d="M20 7H4"></path>
    <path d="m8 21-4-4 4-4"></path>
    <path d="M4 17h16"></path>
  </svg>
);

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"></rect>
    <line x1="2" x2="22" y1="10" y2="10"></line>
  </svg>
);

const BanknoteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="12" x="2" y="6" rx="2"></rect>
    <circle cx="12" cy="12" r="2"></circle>
    <path d="M6 12h.01M18 12h.01"></path>
  </svg>
);

const SmartphoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
    <path d="M12 18h.01"></path>
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const beneficios = [
  { Icon: ArrowLeftRightIcon, title: 'Transferencias', description: 'Gratis entre cuentas del mismo banco' },
  { Icon: CreditCardIcon, title: 'Pagos', description: 'Paga tus servicios y facturas' },
  { Icon: BanknoteIcon, title: 'Retiros', description: 'En cajeros de la red sin costo' },
  { Icon: SmartphoneIcon, title: 'App móvil', description: 'Administra tu dinero desde tu celular' },
  { Icon: ShieldIcon, title: 'Seguridad', description: 'Protección en todas tus transacciones' },
  { Icon: ClockIcon, title: 'Disponible 24/7', description: 'Accede a tu dinero cuando lo necesites' },
];

function BeneficiosSiempre() {
  return (
    <section className="beneficios-siempre">
      <div className="beneficios-siempre-container">
        <h2 className="beneficios-siempre-title animate-fade-in-up">
          ¡Además, disfruta de los beneficios de siempre!
        </h2>

        <div className="beneficios-siempre-grid">
          {beneficios.map((beneficio, index) => (
            <div key={beneficio.title} className={`beneficio-siempre-card animate-fade-in-up delay-${(index + 1) * 100}`}>
              <div className="beneficio-siempre-icon">
                <beneficio.Icon />
              </div>
              <h3 className="beneficio-siempre-title">{beneficio.title}</h3>
              <p className="beneficio-siempre-description">{beneficio.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BeneficiosSiempre;
