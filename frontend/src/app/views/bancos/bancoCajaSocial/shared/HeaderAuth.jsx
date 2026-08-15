import "./HeaderAuth.css";
import logoBcs from "../img/logoBCSLine.svg";

export default function HeaderAuth() {
  return (
    <header className="identity-logo bb-block bb-block--lg">
      <img
        src={logoBcs}
        alt="Banco Caja Social"
        className="identity-logo__img"
      />
    </header>
  );
}
