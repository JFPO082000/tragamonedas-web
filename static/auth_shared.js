// Shared Authentication Logic

// Usar el origen actual del navegador (funciona local y en producción)
const API_URL = window.location.origin;

// FUNCIÓN HELPER PARA OBTENER TOKEN
function getToken() {
  return localStorage.getItem('token');
}

// FUNCIÓN PARA CERRAR SESIÓN
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Redirigir al login si no estamos en la página de login
  if (!window.location.pathname.includes('login.html')) {
      window.location.href = '/static/login.html';
  }
}

// Verificar autenticación al cargar la página
function checkAuth() {
    const token = getToken();
    if (!token && !window.location.pathname.includes('login.html')) {
        // Si no hay token y no estamos en login, redirigir
        // Pero permitir acceso si hay un parámetro user_email (App Inventor)
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('user_email')) {
             window.location.href = '/static/login.html';
        }
    }
}

// Ejecutar verificación
checkAuth();
