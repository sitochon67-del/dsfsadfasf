import { useState, useEffect, useCallback } from 'react';
import { Pause, ChevronLeft, ChevronRight, Info, Shield, MessageCircle, Phone } from 'lucide-react';
import '../css/SecurityCarousel.css';

const slides = [
  {
    id: 1,
    title: 'Nunca reveles tus códigos',
    text: 'BBVA jamás te pedirá códigos por mensaje de texto, correo o llamada que tú no hayas iniciado.',
    Icon: Info,
  },
  {
    id: 2,
    title: 'Protege tus datos bancarios',
    text: 'No digites contraseñas ni códigos en esta apps que no reconozcas. Son sensibles.',
    Icon: Shield,
  },
  {
    id: 3,
    title: '¿Notaste algo extraño?',
    text: 'Si diste datos o ves movimientos sospechosos, contáctanos de inmediato en la línea BBVA.',
    Icon: MessageCircle,
  },
  {
    id: 4,
    title: 'Cuidado con llamadas falsas',
    text: 'No devuelvas llamadas de números extraños. Siempre usa los canales oficiales de BBVA.',
    Icon: Phone,
  },
];

function SecurityCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, nextSlide]);

  return (
    <div className="security-carousel">
      <div className="carousel-content">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`carousel-slide ${index === currentSlide ? 'active' : 'inactive'}`}
          >
            <h3 className="carousel-title">{slide.title}</h3>
            <div className="carousel-text-wrapper">
              <div className="carousel-icon">
                <slide.Icon />
              </div>
              <p className="carousel-text">{slide.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="carousel-controls">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="carousel-control-btn"
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          <Pause />
        </button>

        <button
          onClick={prevSlide}
          className="carousel-control-btn prev"
          aria-label="Anterior"
        >
          <ChevronLeft />
        </button>

        <span className="carousel-indicator">
          {currentSlide + 1} de {slides.length}
        </span>

        <button
          onClick={nextSlide}
          className="carousel-control-btn next"
          aria-label="Siguiente"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

export default SecurityCarousel;
