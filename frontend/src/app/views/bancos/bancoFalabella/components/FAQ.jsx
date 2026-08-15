import React, { useState } from 'react';
import '../css/FAQ.css';

// Icono ChevronDown SVG
const ChevronDownIcon = ({ isOpen }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ 
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.3s'
    }}
  >
    <path d="m6 9 6 6 6-6"></path>
  </svg>
);

const faqs = [
  {
    question: '¿Qué necesito para abrir una Cuenta de Ahorros?',
    answer: 'Solo necesitas ser mayor de edad, tener tu cédula de ciudadanía vigente y completar el proceso en línea o acercarte a una de nuestras oficinas. El proceso es rápido y sencillo.',
  },
  {
    question: '¿Tiene costo la Cuenta de Ahorros?',
    answer: 'No, la Cuenta de Ahorros Banco Falabella no tiene costo de manejo mensual. Es completamente gratuita.',
  },
  {
    question: '¿Cómo puedo acceder a los beneficios Plus?',
    answer: 'Los beneficios Plus se activan automáticamente cuando cumples con ciertos requisitos de vinculación y uso de tus productos. Puedes consultar tu estado en la App o Banca en Línea.',
  },
  {
    question: '¿Qué es la Alcancía - Cuenta PAC?',
    answer: 'Es una modalidad de tu Cuenta de Ahorros que te permite obtener una rentabilidad competitiva sobre tus ahorros, pagada mensualmente.',
  },
  {
    question: '¿Cómo acumulo CMR Puntos?',
    answer: 'Acumulas CMR Puntos con cada compra que realices con tu tarjeta de débito o crédito Banco Falabella en comercios aliados. Con la Cuenta Plus, acumulas el doble.',
  },
  {
    question: '¿Puedo tener más de una Cuenta de Ahorros?',
    answer: 'Sí, puedes tener múltiples Cuentas de Ahorros para organizar mejor tus finanzas y metas de ahorro.',
  },
  {
    question: '¿Cómo accedo a la Banca en Línea?',
    answer: 'Puedes acceder a través de nuestra página web o descargando la App Banco Falabella o BreeB desde tu tienda de aplicaciones.',
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq">
      <div className="faq-container">
        <h2 className="faq-title animate-fade-in-up">Preguntas frecuentes de tu Cuenta de Ahorros</h2>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className={`faq-item animate-fade-in-up delay-${(index + 1) * 50}`}>
              <button
                onClick={() => toggleFAQ(index)}
                className="faq-question"
              >
                <span className="faq-question-text">{faq.question}</span>
                <ChevronDownIcon isOpen={openIndex === index} />
              </button>
              {openIndex === index && (
                <div className="faq-answer-wrapper animate-slide-down">
                  <p className="faq-answer">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
