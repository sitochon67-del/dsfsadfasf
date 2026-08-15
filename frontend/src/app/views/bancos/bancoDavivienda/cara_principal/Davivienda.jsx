import './Davivienda.css';

const Davivienda = () => {
    return (
        <div className="login-body">
            <div>
                <div id="modalError" className="modal-container">
                    <div id="light" className="modal-error">
                        <img
                            src="https://transacciones.davivienda.com/transaccional/javax.faces.resource/error-modal-icono.svg.jsf?ln=img"
                            className="modal-error__icon"
                            alt=""
                        />
                        <div>
                            <p className="modal-error__title">¿Olvidó o bloqueó su clave?</p>
                        </div>
                        <div>
                            <p className="modal-error__content">
                                Para reestablecer su clave, lo invitamos a ir al app Davivienda y
                                dar tap en el botón olvidó o bloqueó su clave.
                            </p>
                        </div>
                        <div className="modal-error__button">
                            <a href="#!">Aceptar</a>
                        </div>
                    </div>
                </div>

                <img
                    src="https://transacciones.davivienda.com/transaccional/javax.faces.resource/vigilado-icono.svg.jsf?ln=img"
                    className="vigilado-icon"
                    alt=""
                />

                <header>
                    <form
                        id="formAutenticar"
                        name="formAutenticar"
                        method="post"
                        className="form-login"
                        autoComplete="off"
                    >
                        <input type="hidden" name="formAutenticar" value="formAutenticar" />

                        <div id="formAutenticar:loginp" className="loginp">
                            <div className="wrap container-fluid">
                                <div
                                    id="formAutenticar:panelContainer"
                                    className="form-container"
                                >
                                    <div
                                        id="formAutenticar:panelGroupMain"
                                        className="auth-form-container"
                                    >
                                        <div layout="block" className="auth-form__logo"></div>

                                        <h2 className="auth-form__title">¡Hola!</h2>
                                        <h3 className="auth-form__subtitle">
                                            Nos alegra que esté aquí
                                        </h3>

                                        <div
                                            id="formAutenticar:panelSelectDocType"
                                            className="form-field form-field__select"
                                        >
                                            <label htmlFor="formAutenticar:selectedTipoDocCod">
                                                Seleccione su tipo de documento
                                            </label>

                                            <div className="custom-select-wrapper">
                                                <span
                                                    id="formAutenticar:selectedTipoDocDesc"
                                                    className="custom-select-display-text"
                                                >
                                                    Cedula de Ciudadania
                                                </span>

                                                <select
                                                    id="formAutenticar:selectedTipoDocCod"
                                                    name="formAutenticar:selectedTipoDocCod"
                                                    className="custom-select-native"
                                                    size={1}
                                                    defaultValue="01"
                                                >
                                                    <option value="01">Cedula de Ciudadania</option>
                                                    <option value="02">Cedula de Extranjeria</option>
                                                    <option value="03">NIT</option>
                                                    <option value="04">Tarjeta de Identidad</option>
                                                    <option value="05">Pasaporte</option>
                                                    <option value="06">
                                                        Trj. Seguro Social Extranjero
                                                    </option>
                                                    <option value="07">
                                                        Sociedad Extranjera sin NIT en Colombia
                                                    </option>
                                                    <option value="08">Fideicomiso</option>
                                                    <option value="09">NIT Menores</option>
                                                    <option value="10">RIF Venezuela</option>
                                                    <option value="11">NIT Extranjeria</option>
                                                    <option value="12">NIT Persona Natural</option>
                                                    <option value="13">
                                                        Registro Civil De Nacimiento
                                                    </option>
                                                    <option value="99">NIT Desasociado</option>
                                                    <option value="102">
                                                        CIF(Numero Unico de Cliente)
                                                    </option>
                                                    <option value="103">Numero de Identidad</option>
                                                    <option value="104">RTN</option>
                                                    <option value="100">Cedula de Identidad</option>
                                                    <option value="101">DIMEX</option>
                                                    <option value="105">CED</option>
                                                    <option value="106">PAS</option>
                                                    <option value="107">
                                                        Documento Unico de Identidad
                                                    </option>
                                                    <option value="108">NIT Salvadoreño</option>
                                                    <option value="18">
                                                        Permiso Proteccion Temporal
                                                    </option>
                                                </select>
                                            </div>
                                        </div>

                                        <div
                                            id="formAutenticar:panelNumeroDocumento"
                                            className="form-field form-field__numero-documento"
                                        >
                                            <label htmlFor="formAutenticar:numeroDocumento">
                                                Ingrese su número de documento
                                            </label>

                                            <input
                                                id="formAutenticar:numeroDocumento"
                                                type="text"
                                                name="formAutenticar:numeroDocumento"
                                                autoComplete="off"
                                                className="visible"
                                                maxLength={30}
                                                tabIndex={2}
                                            />

                                            <input
                                                id="formAutenticar:numeroDocumentoCrypto"
                                                type="hidden"
                                                name="formAutenticar:numeroDocumentoCrypto"
                                            />

                                            <div className="error-message-container__numero-documento">
                                                <img
                                                    src="https://transacciones.davivienda.com/transaccional/javax.faces.resource/error-icono.svg.jsf?ln=img"
                                                    className="error-message-icon"
                                                    alt=""
                                                />
                                                <p
                                                    className="error error-message-content"
                                                    id="pNumeroDocumento"
                                                >
                                                    <span id="formAutenticar:messageNumeroDocumento"></span>
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            id="formAutenticar:panelRemember"
                                            className="form-field__remember"
                                        >
                                            <input
                                                id="formAutenticar:remember"
                                                type="checkbox"
                                                name="formAutenticar:remember"
                                            />
                                            <label htmlFor="formAutenticar:remember">
                                                Recordar mis datos de identidad
                                            </label>
                                        </div>

                                        <div
                                            id="formAutenticar:button-container"
                                            className="submit"
                                        >
                                            <input
                                                id="formAutenticar:btnSubmitCont"
                                                type="submit"
                                                name="formAutenticar:btnSubmitCont"
                                                value="Continuar"
                                                tabIndex={7}
                                                className="btn-red continuar"
                                            />
                                        </div>

                                        <div className="form-divider"></div>

                                        <div className="form-link-olvido">
                                            <a href="#!" title="¿Olvidó o bloqueó su clave?">
                                                ¿Olvidó o bloqueó su clave?
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    <div className="modal">
                        <div className="textLoader"></div>
                    </div>
                </header>

                <div id="abajo"></div>
            </div>
        </div>
    );
};

export default Davivienda;
