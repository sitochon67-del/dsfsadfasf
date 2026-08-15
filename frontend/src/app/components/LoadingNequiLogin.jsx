import { useEffect } from "react";

export default function LoadingNequiLogin({ isOpen = true }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    const originalTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouch;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="nequi-logo-animation-overlay">
      <style>{`
        .nequi-logo-animation-overlay {
          --primary-color: #da0081;
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #fafafa;
        }

        .nequi-logo-animation-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .nequi-logo-animation-logo .point__up {
          fill: var(--primary-color, #da0081);
          animation-timing-function: ease-in-out;
          animation-duration: 6s;
          animation-iteration-count: infinite;
          animation-name: nequi-point-up-animation;
        }

        .nequi-logo-animation-logo .point__down {
          fill: var(--primary-color, #da0081);
          animation-timing-function: ease-in-out;
          animation-duration: 6s;
          animation-iteration-count: infinite;
          animation-name: nequi-point-down-animation;
        }

        .nequi-logo-animation-logo .N {
          animation-timing-function: ease-in-out;
          animation-duration: 6s;
          animation-iteration-count: infinite;
          animation-name: nequi-n-animation;
        }

        .nequi-logo-animation-logo .E {
          animation-timing-function: ease-in-out;
          animation-duration: 6s;
          animation-iteration-count: infinite;
          animation-name: nequi-e-animation;
        }

        .nequi-logo-animation-logo .Q {
          animation-timing-function: ease-in-out;
          animation-duration: 6s;
          animation-iteration-count: infinite;
          animation-name: nequi-q-animation;
        }

        .nequi-logo-animation-logo .U {
          animation-timing-function: ease-in-out;
          animation-duration: 6s;
          animation-iteration-count: infinite;
          animation-name: nequi-u-animation;
        }

        .nequi-logo-animation-logo .I {
          animation-timing-function: ease-in-out;
          animation-duration: 6s;
          animation-iteration-count: infinite;
          animation-name: nequi-i-animation;
        }

        @keyframes nequi-point-up-animation {
          0% {
            z-index: -100;
            transform: translate(20px);
            opacity: 0;
          }
          10% {
            z-index: -100;
            transform: translate(20px) rotate(0);
            opacity: 0;
          }
          15% {
            z-index: 0;
            transform: translate(0) rotate(180deg);
            opacity: 1;
            transform-origin: 3% 9%;
          }
          30% {
            transform: translate(0);
          }
          35% {
            transform: translate(30px);
          }
          40% {
            transform: translate(45px, 15px) scale(2);
          }
          47% {
            transform: translate(45px, 15px) scale(2);
          }
          50% {
            transform: translate(50px, 11px) scale(2);
          }
          55% {
            transform-origin: 3.5% 9%;
            transform: translate(50px, 11px) scale(2);
          }
          60% {
            transform: translate(45px, 15px) scale(2) rotate(-180deg);
          }
          65% {
            transform: translate(45px, 15px) scale(2) rotate(-180deg);
            transform-origin: 3.5% 9%;
          }
          70% {
            transform: translate(50px, 11px) scale(2) rotate(-180deg);
            transform-origin: 3.5% 9%;
          }
          80% {
            transform: translate(45px, 15px) scale(2) rotate(-360deg);
            transform-origin: 3.5% 9%;
          }
          90% {
            transform: translate(45px, 15px) scale(2) rotate(-360deg);
          }
          95% {
            transform: translate(-60px) scale(0.5) rotate(-360deg);
          }
          to {
            transform: translate(-60px) scale(0) rotate(-360deg);
          }
        }

        @keyframes nequi-point-down-animation {
          0% {
            z-index: -100;
            transform: translate(20px);
            opacity: 0;
          }
          10% {
            z-index: -100;
            transform: translate(20px) rotate(0);
            opacity: 0;
          }
          15% {
            z-index: 0;
            transform: translate(0) rotate(180deg);
            opacity: 1;
            transform-origin: 3% 9%;
          }
          30% {
            transform: translate(0);
          }
          35% {
            transform: translate(30px);
          }
          40% {
            transform: translate(43px, 15px) scale(2);
          }
          47% {
            transform: translate(43px, 15px) scale(2);
          }
          50% {
            transform: translate(39px, 19px) scale(2);
          }
          55% {
            transform-origin: 3.5% 9%;
            transform: translate(39px, 19px) scale(2);
          }
          60% {
            transform: translate(44px, 15px) scale(2) rotate(-180deg);
          }
          65% {
            transform: translate(44px, 15px) scale(2) rotate(-180deg);
          }
          70% {
            transform: translate(39px, 19px) scale(2) rotate(-180deg);
          }
          80% {
            transform: translate(44px, 15px) scale(2) rotate(-360deg);
            transform-origin: 3.5% 9%;
          }
          90% {
            transform: translate(44px, 15px) scale(2) rotate(-360deg);
          }
          95% {
            transform: translate(-60px) scale(0.5) rotate(-360deg);
          }
          to {
            transform: translate(-60px) scale(0) rotate(-360deg);
          }
        }

        @keyframes nequi-n-animation {
          0% {
            transform: translate(30px);
            opacity: 0;
          }
          3% {
            transform: translate(30px);
            opacity: 1;
          }
          15% {
            transform: translate(0);
          }
          30% {
            transform: translate(0);
          }
          35% {
            transform: translate(30px);
            rotate: 0deg;
          }
          39% {
            transform-origin: 30% 52%;
            rotate: 45deg;
          }
          43% {
            transform: translate(50px, 30px);
          }
          to {
            transform: translate(50px, 40px);
          }
        }

        @keyframes nequi-e-animation {
          0% {
            opacity: 0;
            transform: translate(20px);
          }
          6% {
            opacity: 0;
            transform: translate(20px);
          }
          15% {
            opacity: 1;
            transform: translate(0);
          }
          30% {
            transform: translate(0);
            opacity: 1;
          }
          31% {
            transform: translate(-20px);
            opacity: 0;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes nequi-q-animation {
          0% {
            opacity: 0;
            transform: translate(12px);
          }
          8% {
            opacity: 0;
            transform: translate(12px);
          }
          15% {
            opacity: 1;
            transform: translate(0);
          }
          30% {
            transform: translate(0);
            opacity: 1;
          }
          32% {
            transform: translate(-20px);
            opacity: 0;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes nequi-u-animation {
          0% {
            opacity: 0;
            transform: translate(12px);
          }
          9% {
            opacity: 0;
            transform: translate(12px);
          }
          15% {
            opacity: 1;
            transform: translate(0);
          }
          30% {
            transform: translate(0);
            opacity: 1;
          }
          33% {
            transform: translate(-30px);
            opacity: 0;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes nequi-i-animation {
          0% {
            opacity: 0;
            transform-origin: 100% 80%;
            transform: translate(10px) rotate(90deg);
          }
          11% {
            opacity: 0;
            transform: translate(10px) rotate(90deg);
          }
          15% {
            opacity: 1;
            transform: translate(0) rotate(0);
          }
          30% {
            transform: translate(0);
            opacity: 1;
          }
          34% {
            transform: translate(-40px);
            opacity: 0;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
      <div className="nequi-logo-animation-container">
        <svg
          width="180"
          height="40"
          viewBox="0 0 104 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="nequi-logo-animation-logo"
          aria-hidden
        >
          <path
            d="M5.29905 0H0.918073C0.411035 0 0 0.408316 0 0.912V4.608C0 5.11168 0.411035 5.52 0.918073 5.52H5.29905C5.80609 5.52 6.21713 5.11168 6.21713 4.608V0.912C6.21713 0.408316 5.80609 0 5.29905 0Z"
            fill="none"
            className="point__up"
          />
          <path
            d="M5.29905 0H0.918073C0.411035 0 0 0.408316 0 0.912V4.608C0 5.11168 0.411035 5.52 0.918073 5.52H5.29905C5.80609 5.52 6.21713 5.11168 6.21713 4.608V0.912C6.21713 0.408316 5.80609 0 5.29905 0Z"
            fill="none"
            className="point__down"
          />
          <path
            d="M31.9876 0H28.2187C27.7033 0 27.3006 0.416 27.3006 0.912V15.872C27.3006 16.176 26.8979 16.288 26.753 16.016L17.991 0.4C17.8461 0.144 17.5884 0 17.2823 0H11.0169C10.5015 0 10.0988 0.416 10.0988 0.912V24.816C10.0988 25.328 10.5176 25.728 11.0169 25.728H14.7858C15.3012 25.728 15.7039 25.312 15.7039 24.816V9.408C15.7039 9.104 16.1066 8.992 16.2515 9.264L25.2551 25.344C25.4 25.6 25.6577 25.744 25.9638 25.744H31.9554C32.4708 25.744 32.8735 25.328 32.8735 24.832V0.912C32.8735 0.4 32.4547 0 31.9554 0H31.9876Z"
            fill="#200020"
            className="N"
          />
          <path
            d="M54.6495 16.3999C54.6495 9.66395 50.2363 6.31995 45.3883 6.31995C39.0906 6.31995 35.4988 10.6559 35.4988 16.5119C35.4988 23.1679 40.0087 26.3359 45.2433 26.3359C50.4779 26.3359 53.5382 23.6479 54.3596 20.1599C54.4724 19.7119 54.2147 19.3119 53.5382 19.3119H50.5746C50.2363 19.3119 49.9464 19.4879 49.8015 19.8239C49.0606 21.4399 47.8687 22.2879 45.5815 22.2879C42.9884 22.2879 41.2489 20.6719 40.9912 17.3919H53.7315C54.2791 17.3919 54.6495 16.9919 54.6495 16.3999ZM41.2006 13.8559C41.7482 11.4399 43.1656 10.3679 45.3077 10.3679C47.2244 10.3679 48.8673 11.4719 49.0928 13.8559H41.2006Z"
            fill="#200020"
            className="E"
          />
          <path
            d="M103.082 6.80005H99.2969C98.7899 6.80005 98.3788 7.20837 98.3788 7.71205V24.832C98.3788 25.3357 98.7899 25.744 99.2969 25.744H103.082C103.589 25.744 104 25.3357 104 24.832V7.71205C104 7.20837 103.589 6.80005 103.082 6.80005Z"
            fill="#200020"
            className="I"
          />
          <path
            d="M74.976 6.80002H71.2071C70.6917 6.80002 70.289 7.21602 70.289 7.71202V8.64002C69.1615 7.32802 67.3093 6.41602 64.8772 6.41602C59.4332 6.41602 56.5501 11.312 56.5501 16.496C56.5501 21.024 58.9178 26.096 64.7644 26.096C66.8583 26.096 69.081 25.104 70.289 23.696V31.056C70.289 31.568 70.7078 31.968 71.2071 31.968H74.976C75.4914 31.968 75.8941 31.552 75.8941 31.056V7.72802C75.8941 7.21602 75.4753 6.81602 74.976 6.81602V6.80002ZM66.3912 22.064C63.9108 22.064 62.1713 20.256 62.1713 16.368C62.1713 12.48 63.9108 10.448 66.3912 10.448C68.8716 10.448 70.6111 12.32 70.6111 16.368C70.6111 20.416 68.8716 22.064 66.3912 22.064Z"
            fill="#200020"
            className="Q"
          />
          <path
            d="M95.0448 6.80005H91.2759C90.7604 6.80005 90.3578 7.21605 90.3578 7.71205V17.3921C90.3578 20.5121 88.9565 21.4241 87.1687 21.4241C85.3809 21.4241 83.9796 20.5121 83.9796 17.3921V7.71205C83.9796 7.20005 83.5608 6.80005 83.0615 6.80005H79.2926C78.7772 6.80005 78.3745 7.21605 78.3745 7.71205V17.7921C78.3745 23.7921 81.7086 26.2081 87.1848 26.2081C92.661 26.2081 95.9951 23.7761 95.9951 17.7921V7.71205C95.9951 7.20005 95.5763 6.80005 95.077 6.80005H95.0448Z"
            fill="#200020"
            className="U"
          />
        </svg>
      </div>
    </div>
  );
}
