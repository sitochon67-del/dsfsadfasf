import "./FooterAuth.css";

export default function FooterAuth() {
  return (
    <div className=" bb-block bb-block--sm">
      <hr className="bb-block bb-block--lg identity-separator" />
      ¿Es un cliente nuevo?{" "}
      <strong>
        <a className="btn-link-text" href="#">
          Registrarse
        </a>
      </strong>
    </div>
  );
}
