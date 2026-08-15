import React from 'react';
import '../css/MasBeneficios.css';

// Icono ArrowRight SVG
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);

const beneficios = [
  {
    image: '/assets/mas-beneficios/asset_1.jpg',
    title: 'Experiencias únicas',
    description: 'Accede a eventos exclusivos, conciertos y experiencias solo para clientes.',
    link: 'Conocer más',
  },
  {
    image: '/assets/mas-beneficios/asset_2.jpg',
    title: 'Asesoría personalizada',
    description: 'Recibe asesoría financiera personalizada para alcanzar tus metas.',
    link: 'Solicitar asesoría',
  },
  {
    image: '/assets/mas-beneficios/asset_3.jpg',
    title: 'Pagos sin contacto',
    description: 'Realiza pagos rápidos y seguros con tecnología contactless.',
    link: 'Ver cómo funciona',
  },
  {
    image: '/assets/mas-beneficios/asset_4.jpg',
    title: 'Protección de compras',
    description: 'Seguro incluido que protege tus compras en caso de daño o robo.',
    link: 'Conocer cobertura',
  },
];

function MasBeneficios() {
  return (
    <section className="mas-beneficios">
      <div className="mas-beneficios-container">
        <h2 className="mas-beneficios-title animate-fade-in-up">Más beneficios para ti</h2>

        <div className="mas-beneficios-grid">
          {beneficios.map((beneficio, index) => (
            <div key={beneficio.title} className={`mas-beneficio-card animate-fade-in-up delay-${(index + 1) * 100}`}>
              <div className="mas-beneficio-image-wrapper">
                <img
                  src={beneficio.image}
                  alt={beneficio.title}
                  className="mas-beneficio-image"
                />
              </div>
              <div className="mas-beneficio-content">
                <h3 className="mas-beneficio-title">{beneficio.title}</h3>
                <p className="mas-beneficio-description">{beneficio.description}</p>
                <a href="#" className="mas-beneficio-link">
                  {beneficio.link}
                  <ArrowRightIcon />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MasBeneficios;
