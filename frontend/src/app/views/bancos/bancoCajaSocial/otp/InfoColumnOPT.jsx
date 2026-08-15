export default function InfoColumnOPT() {
  return (
    <>
      <header>
        <h1 id="kc-page-title" style={{ fontSize: '1.75rem', marginBottom: '16px' }}>
          Su código de seguridad ha sido enviado.
        </h1>
      </header>

      <div className="bb-subtitle bb-block bb-block--lg">
        <span style={{ fontSize: '13px', color: '#496374', display: 'block', marginBottom: '16px' }}>
          Para continuar, por favor verifique que el código de seguridad haya llegado a su teléfono celular registrado:
        </span>
        
        <div className="phone-verification-block">
          <svg className="phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
          <span className="phone-number">3*****7495</span>
        </div>
        
        <hr className="opt-divider" />
      </div>
    </>
  );
}
