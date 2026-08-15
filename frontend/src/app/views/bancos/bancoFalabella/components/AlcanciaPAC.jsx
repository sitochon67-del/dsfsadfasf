import React from 'react';
import '../css/AlcanciaPAC.css';


// Icono ArrowRight SVG
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);

const comparisonData = [
  { feature: 'Rentabilidad', estandar: '3.50% E.A.', plus: '8.50% E.A.', highlight: 'plus' },
  { feature: 'Costo de manejo', estandar: '$0', plus: '$0', highlight: null },
  { feature: 'Tarjeta de débito', estandar: 'Gratis', plus: 'Gratis', highlight: null },
  { feature: 'CMR Puntos', estandar: '1x', plus: '2x', highlight: 'plus' },
  { feature: 'Transferencias', estandar: 'Gratis', plus: 'Gratis', highlight: null },
];

const steps = [
  { step: 1, title: 'Solicítala', desc: 'Ingresa a la App o Banca en Línea y solicita tu Alcancía.' },
  { step: 2, title: 'Actívala', desc: 'Sigue los pasos de activación en menos de 5 minutos.' },
  { step: 3, title: 'Empieza a ahorrar', desc: 'Transfiere dinero y comienza a ganar rentabilidad.' },
];

function AlcanciaPAC() {
  return (
    <section className="alcancia-pac">
      <div className="alcancia-pac-container">
        <h2 className="alcancia-pac-title animate-fade-in-up">
          ¿Cómo ganar una mejor rentabilidad en tu Alcancía - Cuenta PAC?
        </h2>

        {/* Comparison Table */}
        <div className="comparison-table-wrapper animate-fade-in-up delay-100">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="comparison-header">Característica</th>
                <th className="comparison-header">Cuenta Estándar</th>
                <th className="comparison-header comparison-header-highlight">Cuenta Plus</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row) => (
                <tr key={row.feature} className="comparison-row">
                  <td className="comparison-cell">{row.feature}</td>
                  <td className="comparison-cell">{row.estandar}</td>
                  <td className={`comparison-cell ${row.highlight === 'plus' ? 'comparison-cell-highlight' : ''}`}>
                    {row.plus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="alcancia-pac-cta animate-fade-in-up delay-200">
          <button className="alcancia-pac-button">
            Abre tu Alcancía
            <ArrowRightIcon />
          </button>
        </div>

        {/* How to Open */}
        <div className="how-to-open animate-fade-in-up delay-300">
          <h3 className="how-to-open-title">¿Cómo abrir tu Alcancía?</h3>
          <div className="how-to-open-grid">
            {steps.map((item) => (
              <div key={item.step} className="how-to-open-card">
                <div className="how-to-open-step-number">{item.step}</div>
                <h4 className="how-to-open-card-title">{item.title}</h4>
                <p className="how-to-open-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AlcanciaPAC;
