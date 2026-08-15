import React, { useState } from 'react';
import '../css/Beneficios.css';


// Icono Check SVG
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const tabs = [
  { id: 'estandar', label: 'Estándar' },
  { id: 'plus', label: 'Plus' },
];

const estandarBenefits = [
  'Sin costo de manejo mensual',
  'Tarjeta de débito sin costo',
  'Transferencias gratuitas entre cuentas del mismo banco',
  'Acceso a Banca en Línea y App móvil',
  'Retiros en cajeros de la red',
];

const plusBenefits = [
  'Todo lo del plan Estándar',
  'Hasta 8.50% E.A. en tu Alcancía',
  'Doble acumulación de CMR Puntos',
  'Descuentos exclusivos en comercios aliados',
  'Seguro de protección de compras',
  'Asistencia telefónica prioritaria',
];

function Beneficios() {
  const [activeTab, setActiveTab] = useState('estandar');
  const benefits = activeTab === 'estandar' ? estandarBenefits : plusBenefits;

  return (
    <section className="beneficios">
      <div className="beneficios-container">
        <h2 className="beneficios-title animate-fade-in-up">
          Una Cuenta de Ahorros con la que tú escoges tener Beneficios Estándar o Plus
        </h2>

        {/* Tabs */}
        <div className="tabs-container animate-fade-in-up delay-100">
          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="beneficios-grid">
          {/* Image */}
          <div className="beneficios-image-wrapper animate-fade-in-up delay-200">
            <img
              src="/assets/beneficios/asset_1.jpg"
              alt="Mujer con tarjeta"
              className="beneficios-image"
            />
          </div>

          {/* Benefits List */}
          <div className="beneficios-list-wrapper animate-fade-in-up delay-300">
            <h3 className="beneficios-list-title">
              Beneficios {activeTab === 'estandar' ? 'Estándar' : 'Plus'}
            </h3>
            <ul className="beneficios-list">
              {benefits.map((benefit, index) => (
                <li key={index} className="beneficio-item" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="beneficio-icon">
                    <CheckIcon />
                  </div>
                  <span className="beneficio-text">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Beneficios;
