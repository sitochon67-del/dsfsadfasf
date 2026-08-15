import { useState } from "react";
import "./LoginCardOPT.css";

export default function LoginCardOPT() {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const empty = value.trim() === "";
  const valid = value.length === 6;

  const onChange = (e) => {
    // Solo permitir números
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 6) {
      setValue(val);
    }
    setTouched(true);
  };

  return (
    <form className="bb-form opt-form">
      
      <p className="opt-instructions">
        Por favor ingrese el código compuesto por 6 dígitos:
      </p>

      <div className="bb-form-field--md opt-field-group">
        <label className="label">Código de seguridad</label>
        
        <div className="opt-input-row">
          <input
            className="form-control opt-input"
            type="text"
            inputMode="numeric"
            value={value}
            onChange={onChange}
            autoComplete="one-time-code"
            maxLength={6}
          />
          <button 
            type="button" 
            className="btn btn-primary opt-submit-btn" 
            disabled={!valid}
            onClick={() => console.log("OTP Enviar clicked")}
          >
            Enviar
          </button>
        </div>

        {touched && empty && (
          <small className="bb-input-validation-message">
            Campo obligatorio.
          </small>
        )}
        
        {touched && !empty && !valid && (
          <small className="bb-input-validation-message">
            El código debe tener 6 dígitos.
          </small>
        )}
      </div>

      <div className="opt-links-container">
        <div className="opt-link-group">
          <span>¿No recibió el código? </span>
          <button type="button" className="opt-link-btn">Reenviar</button>
        </div>
        
        <div className="opt-link-group">
          <button type="button" className="opt-link-btn block-link">
            ¿Tiene algún problema con este número de teléfono celular?
          </button>
        </div>
        
        <div className="opt-link-group">
          <button type="button" className="opt-link-btn block-link">
            Intente con otro medio
          </button>
        </div>
      </div>
    </form>
  );
}
