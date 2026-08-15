import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Componente AuthGuard para proteger rutas
const AuthGuard = ({ children }) => {

  // Hook de navegación
  const navigate = useNavigate();

  // Efecto para validar la sesión al montar el componente
  useEffect(() => {

    // Función para validar la sesión
    const validarSesion = () => {

      // Se coloca un  bloque try-catch para manejar errores
      try {

        // Obtener datos del localStorage
        const datosUsuarioStr = localStorage.getItem('datos_usuario');

        // Verificar si existen datos de usuario
        if (!datosUsuarioStr) {

          // Si no hay datos, lanzar un error
          throw new Error('No hay datos de usuario');
        };

        // Parsear los datos del usuario
        const datosUsuario = JSON.parse(datosUsuarioStr);

        // Verificar si existe la sesión ID
        if (!datosUsuario.sesion_id) {

          // Si no hay sesión ID, lanzar un error
          throw new Error('No hay ID de sesión');
        };
      } catch (error) {

        // Evitar loops infinitos si ya estamos en la página de destino
        if (window.location.pathname !== '/ingresa-tus-datos' || window.location.pathname !== '/personas') {

          // Redirigir al usuario a la página de ingreso de datos
          window.location.href = '/personas';
        };
      };
    };

    // Llamar a la función de validación de sesión
    validarSesion();
  }, [navigate]);

  // dejaremos que se intente renderizar y se redirija si falla.
  return children;
};

// Exportar el componente AuthGuard
export default AuthGuard;