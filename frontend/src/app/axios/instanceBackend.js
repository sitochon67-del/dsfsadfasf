// Se importa axios
import axios from "axios";

// Se instancia el servicio
const instanceBackend = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL_BACKEND,
  withCredentials: true,
});

// Se exporta el servicio
export { instanceBackend };