import Header from './components/Header';
import SecurityBanner from './components/SecurityBanner';
import LoginForm from './components/LoginForm';
import PromoCard from './components/PromoCard';
import Footer from './components/Footer';
import "./css/BancoBbva.css";

function BancoBbva() {
  return (
    <div className="BancoBbva">
      <Header />
      <SecurityBanner />

      <main className="main-content">
        <div className="content-container">
          <div className="content-grid">
            <LoginForm />
            <PromoCard />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default BancoBbva;
