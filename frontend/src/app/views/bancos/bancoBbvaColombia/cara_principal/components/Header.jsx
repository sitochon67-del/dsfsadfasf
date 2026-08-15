import { X } from 'lucide-react';
import '../css/Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <svg 
              className="bbva-logo" 
              viewBox="0 0 120 40" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <text x="0" y="30">BBVA</text>
            </svg>
            
            <nav className="nav">
              <a href="#" className="nav-link active">Persona</a>
              <a href="#" className="nav-link">Empresa</a>
            </nav>
          </div>
          
          <button className="close-button">
            <span>Cerrar</span>
            <X className="close-icon" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
