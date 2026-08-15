import "../css/FooterAuth.css";

export default function FooterAuth() {
  return (
    <footer className="footer-auth">
      <hr className="footer-divider" />

      {/* MOBILE */}
      <div className="footer-mobile">
        <img
          src="/assets/img/grupoaval_color.svg"
          alt="Grupo Aval"
          className="footer-logo-aval"
        />

        <img
          src="/assets/img/logo_vigilado_horizontal_black.svg"
          alt="Vigilado Superintendencia Financiera"
          className="footer-logo-vigilado"
        />
      </div>

      {/* DESKTOP (si luego lo necesitas) */}
      <div className="footer-desktop">
        <img
          src="/assets/img/logo-vigilado.svg"
          alt="Vigilado Superintendencia Financiera"
        />
      </div>
    </footer>
  );
}
