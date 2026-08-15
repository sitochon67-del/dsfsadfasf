import React from 'react';
import '../css/BeneficiosPlus.css';

// Iconos SVG
const PercentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" x2="5" y1="5" y2="19"></line>
    <circle cx="6.5" cy="6.5" r="2.5"></circle>
    <circle cx="17.5" cy="17.5" r="2.5"></circle>
  </svg>
);

const GiftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="4" rx="1"></rect>
    <path d="M12 8v13"></path>
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path>
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 2.5 2.5v5"></path>
    <path d="M16.5 8v-2.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5h-5"></path>
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
  </svg>
);

const HeadphonesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 14v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3"></path>
    <path d="M17 14v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3"></path>
    <path d="M5 14a7 7 0 0 1 14 0"></path>
    <path d="M12 14v3"></path>
  </svg>
);

const beneficiosPlus = [
  { Icon: PercentIcon, title: 'Hasta 8.50% E.A.', description: 'Obtén la mejor rentabilidad del mercado en tu Alcancía - Cuenta PAC.' },
  { Icon: GiftIcon, title: 'Doble acumulación de CMR Puntos', description: 'Acumula puntos más rápido en todas tus compras y canjea por premios.' },
  { Icon: ShieldIcon, title: 'Seguro de protección', description: 'Cobertura en compras y protección ante fraudes en tu tarjeta.' },
  { Icon: HeadphonesIcon, title: 'Atención prioritaria', description: 'Línea exclusiva de atención para clientes con beneficios Plus.' },
];

function BeneficiosPlus() {
  return (
    <section className="beneficios-plus">
      <div className="beneficios-plus-container">
        <h2 className="beneficios-plus-title animate-fade-in-up">
          Estos son algunos Beneficios Plus a los cuales puedes acceder con tu Cuenta de Ahorros
        </h2>

        <div className="beneficios-plus-grid">
          {/* Image */}
          <div className="beneficios-plus-image-wrapper animate-fade-in-up delay-100">
            <img
              src="/assets/rentabilidad/asset_1.jpg"
              alt="Mujer recibiendo paquete"
              className="beneficios-plus-image"
            />
          </div>

          {/* Benefits Grid */}
          <div className="beneficios-plus-cards">
            {beneficiosPlus.map((beneficio, index) => (
              <div key={beneficio.title} className={`beneficio-card animate-fade-in-up delay-${(index + 2) * 100}`}>
                <div className="beneficio-card-icon">
                  <beneficio.Icon />
                </div>
                <h3 className="beneficio-card-title">{beneficio.title}</h3>
                <p className="beneficio-card-description">{beneficio.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BeneficiosPlus;
