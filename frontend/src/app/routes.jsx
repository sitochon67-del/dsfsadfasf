import { createBrowserRouter, Navigate } from "react-router-dom";
import { Suspense } from "react";
import generalRoutes from "./views/bancos/generalRoutes";
import Cargandogeneral from "./components/Cargandogeneral";

// Configura las rutas principales de la aplicación, envolvemos cada ruta en Suspense para manejar componentes lazy
const routesWithSuspense = generalRoutes.map(route => {

  // SE valida si hay un elemento en la ruta
  if (route.element) {

    // Se retorna los elementos
    return {
      ...route,

      // Se envuelve el elemento en un Suspense
      element: (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}>Cargando...</div>}>
          {route.element}
        </Suspense>
      )
    };
  }
  return route;
});

// Se exportan las rutas
const routes = createBrowserRouter([
  // Vista sandbox para desarrollar pantallas de carga (sidebar no queda cubierta por overlays)
  { path: "/dev/cargandogeneral", element: <Cargandogeneral /> },

  // Se agregan las rutas con Suspense
  ...routesWithSuspense,

  // Ruta por defecto
  { path: "/", element: <Navigate to="/pse" replace /> },

  // Ruta para manejar páginas no encontradas
  { path: "*", element: <Navigate to="/pse" replace /> },
]);

// Se exporta el router configurado
export default routes;