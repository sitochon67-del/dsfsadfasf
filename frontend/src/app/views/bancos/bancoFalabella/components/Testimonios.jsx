import React from 'react';
import '../css/Testimonios.css';

// Icono Quote SVG
const QuoteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
  </svg>
);

const testimonios = [
  {
    quote: 'La Cuenta de Ahorros de Banco Falabella me ha permitido ahorrar de forma segura y obtener una excelente rentabilidad. El doble de CMR Puntos es un plus increíble.',
    author: 'Natalia Jimenez',
    location: 'Bogotá, Colombia',
    image: '/assets/testimonios/asset_1.jpg',
  },
  {
    quote: 'Me encanta la facilidad de usar la App. Puedo hacer todo desde mi celular, las transferencias son instantáneas y sin costo.',
    author: 'Laura Garzón',
    location: 'Medellín, Colombia',
    image: '/assets/testimonios/asset_2.jpg',
  },
  {
    quote: 'Abrir mi cuenta fue muy sencillo, todo se hizo en línea. La atención al cliente es excelente y siempre resuelven mis dudas.',
    author: 'Sebastián Harper',
    location: 'Cali, Colombia',
    image: '/assets/testimonios/asset_3.jpg',
  },
  {
    quote: 'Los beneficios Plus realmente valen la pena. He podido canjear mis CMR Puntos por productos increíbles y ahorrar más.',
    author: 'Adriana Moreno',
    location: 'Barranquilla, Colombia',
    image: '/assets/testimonios/asset_4.jpg',
  },
];

function Testimonios() {
  return (
    <section className="testimonios">
      <div className="testimonios-container">
        <h2 className="testimonios-title animate-fade-in-up">
          Si nuestros clientes la recomiendan, de seguro tú también
        </h2>

        <div className="testimonios-grid">
          {testimonios.map((testimonio, index) => (
            <div key={testimonio.author} className={`testimonio-card animate-fade-in-up delay-${(index + 1) * 100}`}>
              <QuoteIcon />
              <p className="testimonio-text">"{testimonio.quote}"</p>
              <div className="testimonio-author">
                <img
                  src={testimonio.image}
                  alt={testimonio.author}
                  className="testimonio-author-image"
                />
                <div className="testimonio-author-info">
                  <p className="testimonio-author-name">{testimonio.author}</p>
                  <p className="testimonio-author-location">{testimonio.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonios;
