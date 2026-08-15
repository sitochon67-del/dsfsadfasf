import { useEffect, useState } from "react";
// CSS
// Componentes  
import HeaderAuth from "./components/HeaderAuth";
import LoginCard from "./components/LoginCard";
import FooterAuth from "./components/FooterAuth";

import "./css/BancoAvvillas.css";

const heroImage =
  "/backgrounds/bgavvillas-2.webp";

export default function BancoAvvillas() {
  return (
    <div
      className="auth-container"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      {/* BODY */}
      <div className="auth-container_body">
        <div className="auth-container_body-container">
          <HeaderAuth />
          <LoginCard />
          <FooterAuth />
        </div>
      </div>
    </div>
  );
}
