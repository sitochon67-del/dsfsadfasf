import "../css/LoginCard.css";
import { useState } from "react";
import "../css/LoginCard.css";

export default function LoginCard() {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [docType, setDocType] = useState("Cédula de Ciudadanía");
  const [docOpen, setDocOpen] = useState(false);

  /* ✅ DEFINE LA FUNCIÓN AQUÍ */
  const formatNumber = (value) => {
    const onlyNumbers = value.replace(/\D/g, "");
    return onlyNumbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const documentTypes = [
    "Cédula de Ciudadanía",
    "Cédula de Extranjería",
    "Tarjeta de Identidad",
  ];

  const passwordHasValue = password.length > 0;
  const passwordHasError = passwordTouched && !passwordHasValue;

  const hasValue = value.length > 0;
  const hasError = touched && !hasValue;

  const isFormValid =
    value.trim().length > 0 &&
    password.trim().length > 0 &&
    docType.trim().length > 0;

  // 👇 return sigue igual

  return (
    <div className="login-container">
      <form className="login-form" noValidate>
        {/* TIPO DE DOCUMENTO */}
        <div
          className={`bavv-form-input dropdown ${docOpen ? "focused filled" : "filled"
            }`}
        >
          <label htmlFor="user-type-document">
            <input
              type="text"
              id="user-type-document"
              placeholder=" "
              value={docType}
              readOnly
              onClick={() => setDocOpen((prev) => !prev)}
            />
            <span className="label">Tipo de documento</span>
            <span className="bavv-form-border"></span>
            <span
              className={`bavv-form-icon icon-down ${docOpen ? "open" : ""
                }`}
            />
          </label>
          {docOpen && (
            <ul className="bavv-dropdown-list">
              {documentTypes.map((type) => (
                <li
                  key={type}
                  className={type === docType ? "active" : ""}
                  onClick={() => {
                    setDocType(type);
                    setDocOpen(false);
                  }}
                >
                  {type}
                </li>
              ))}
            </ul>
          )}
        </div>


        {/* NÚMERO DE DOCUMENTO */}

        <div className="login-container">
          <div
            className={`bavv-form-input icon
                ${!hasError && focused ? "focused" : ""}
                ${hasValue ? "filled" : ""}
                ${hasError ? "error" : ""}
              `}
          >
            <label htmlFor="user-document">
              <input
                type="text"
                id="user-document"
                placeholder=" "
                autoComplete="off"
                value={value}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  setTouched(true);
                }}
                onChange={(e) => {
                  const formatted = formatNumber(e.target.value);
                  setValue(formatted);
                }}

              />
              <span className="label">Número de documento</span>
              <span className="bavv-form-border"></span>
              {!hasError && (
                <span className="bavv-form-icon icon-usuario" />
              )}
            </label>
            {hasError && (
              <div className="validation-message">
                Este campo es requerido
              </div>
            )}
          </div>
        </div>

        {/* CONTRASEÑA */}
        <div
          className={`bavv-form-input icon
    ${!passwordHasError && passwordFocused ? "focused" : ""}
    ${passwordHasValue ? "filled" : ""}
    ${passwordHasError ? "error" : ""}
  `}
        >
          <label htmlFor="user-password">
            <input
              type="password"
              id="user-password"
              placeholder=" "
              autoComplete="new-password"
              value={password}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => {
                setPasswordFocused(false);
                setPasswordTouched(true);
              }}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span className="label">Ingresa tu contraseña</span>
            <span className="bavv-form-border"></span>
            {!passwordHasError && (
              <span className="bavv-form-icon icon-lock" />
            )}
            {passwordHasError && (
              <span className="alert-icon" />
            )}
          </label>
        </div>



        {/* OLVIDÉ CONTRASEÑA */}
        <div className="forgot-password">
          <a href="#" className="avv-title-semibold">
            Olvidé mi contraseña
          </a>
          <i className="icon-seguridad2 icon"></i>
        </div>

        {/* BOTÓN */}
        <div className="login-btn">
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={!isFormValid}
          >
            INGRESAR
          </button>
        </div>

        {/* REGISTRO */}
        <div className="register">
          <p>¿Aún no tienes contraseña para ingresar?</p>
          <a href="#" className="avv-title-semibold">
            Regístrate
          </a>
        </div>

        {/* AYUDA */}
        <div className="login-issues">
          <a href="#" className="avv-title-semibold">
            ¿Tienes problemas para ingresar?
          </a>
        </div>
      </form>
    </div>
  );
}
