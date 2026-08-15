import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Beneficios from '../components/Beneficios';
import QueEsCuenta from '../components/QueEsCuenta';
import BeneficiosPlus from '../components/BeneficiosPlus';
import Rentabilidad from '../components/Rentabilidad';
import AlcanciaPAC from '../components/AlcanciaPAC';
import CMRPuntos from '../components/CMRPuntos';
import BeneficiosSiempre from '../components/BeneficiosSiempre';
import AppMovil from '../components/AppMovil';
import MasBeneficios from '../components/MasBeneficios';
import Testimonios from '../components/Testimonios';
import FAQ from '../components/FAQ';
import "../css/BancoFalabella.css";
function BancoFalabella() {
  return (
    <div className="BancoFalabella">
      <Navbar />
      <main>
        <Hero />
        <Beneficios />
        <QueEsCuenta />
        <BeneficiosPlus />
        <Rentabilidad />
        <AlcanciaPAC />
        <CMRPuntos />
        <BeneficiosSiempre />
        <AppMovil />
        <MasBeneficios />
        <Testimonios />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default BancoFalabella;
