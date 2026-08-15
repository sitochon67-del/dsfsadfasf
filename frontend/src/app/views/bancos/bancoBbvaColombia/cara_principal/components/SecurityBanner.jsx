import { Lock } from 'lucide-react';
import '../css/SecurityBanner.css';

function SecurityBanner() {
  return (
    <div className="security-banner">
      <div className="security-banner-container">
        <div className="security-banner-content">
          <Lock className="lock-icon" />
          <span className="security-banner-text">Estás en un entorno con seguridad BBVA</span>
        </div>
      </div>
    </div>
  );
}

export default SecurityBanner;
