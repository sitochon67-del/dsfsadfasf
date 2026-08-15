import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Eye, EyeOff } from 'lucide-react';
import '../css/LoginForm.css';

const documentTypes = [
  'Cédula de ciudadanía',
  'Cédula de Extranjería',
  'Tarjeta de Identidad',
  'Pasaporte',
  'Número de Identificación Personal',
];

function LoginForm() {
  const [selectedDocType, setSelectedDocType] = useState('Cédula de ciudadanía');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="login-card">
      <h1 className="login-title">
        Hola, inicia sesión en BBVA Net:
      </h1>

      <form className="login-form" onSubmit={(e) => e.preventDefault()}>
        {/* Document Type Dropdown */}
        <div className="dropdown" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`dropdown-button ${isDropdownOpen ? 'open' : ''}`}
          >
            <span className="dropdown-button-text">{selectedDocType}</span>
            <ChevronDown className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              {documentTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedDocType(type);
                    setIsDropdownOpen(false);
                  }}
                  className={`dropdown-item ${selectedDocType === type ? 'selected' : ''}`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Document Number Input */}
        <div className="input-wrapper">
          <input
            type="text"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="Número de documento"
            className="input-field"
            style={{ paddingRight: documentNumber ? '40px' : '16px' }}
          />
          {documentNumber && (
            <button
              type="button"
              onClick={() => setDocumentNumber('')}
              className="input-clear-btn"
            >
              <X />
            </button>
          )}
        </div>

        {/* Password Input */}
        <div className="input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="input-field"
            style={{ paddingRight: password ? '80px' : '16px' }}
          />
          <div className="input-actions">
            {password && (
              <button
                type="button"
                onClick={() => setPassword('')}
                className="input-action-btn"
              >
                <X />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="input-action-btn"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-button">
          Entrar
        </button>

        {/* Forgot Password Link */}
        <div className="forgot-password">
          <a href="#" className="forgot-password-link">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
