import { Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';
import '../css/Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <svg 
            className="footer-logo" 
            viewBox="0 0 120 40" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <text x="0" y="30">BBVA</text>
          </svg>

          <div className="footer-social">
            <a href="#" className="social-link" aria-label="Facebook">
              <Facebook />
            </a>
            <a href="#" className="social-link" aria-label="Twitter">
              <Twitter />
            </a>
            <a href="#" className="social-link" aria-label="LinkedIn">
              <Linkedin />
            </a>
            <a href="#" className="social-link" aria-label="YouTube">
              <Youtube />
            </a>
          </div>
        </div>

        <nav className="footer-nav">
          <a href="#" className="footer-nav-link">Sitemap</a>
          <a href="#" className="footer-nav-link">Seguridad</a>
          <a href="#" className="footer-nav-link">Aviso legal</a>
          <a href="#" className="footer-nav-link">Políticas</a>
          <a href="#" className="footer-nav-link">Reglamento de producto</a>
        </nav>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2022 Banco Bilbao Vizcaya Argentaria, S.A.
          </p>
          <p className="footer-tagline">Creando Oportunidades</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
