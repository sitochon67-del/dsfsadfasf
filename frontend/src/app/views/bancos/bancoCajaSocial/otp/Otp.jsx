import { useEffect, useState } from "react";

// Componentes
import FooterAuth from "../shared/FooterAuth";
import HeaderAuth from "../shared/HeaderAuth";
import InfoColumnOPT from "./InfoColumnOPT";
import LoginCardOPT from "./LoginCardOPT";

// CSS
import "../pse/login/login_caja_social_pse.css";
import bg1 from "../img/bg-1.png";
import bg2 from "../img/bg-2.png";
import bg3 from "../img/bg-3.png";
import bg4 from "../img/bg-4.png";

const heroImages = [
  bg1,
  bg2,
  bg3,
  bg4,
];

export default function Otp() {
  const [hero, setHero] = useState(heroImages[0]);

  useEffect(() => {
    const random = Math.floor(Math.random() * heroImages.length);
    setHero(heroImages[random]);
  }, []);

  return (
    <div className="bcs-layout">
      {/* COLUMNA IMAGEN */}
      <div className="bcs-image" style={{ backgroundImage: `url(${hero})` }} />

      {/* COLUMNA FORM */}
      <div className="bcs-form">
        <HeaderAuth />
        <InfoColumnOPT />
        <LoginCardOPT />
        <FooterAuth />
      </div>
    </div>
  );
}
