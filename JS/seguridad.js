import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// Escuchamos el estado de la autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    // El usuario está logueado correctamente.
    console.log("Acceso autorizado para:", user.uid);
    // Aquí más adelante podemos cargar su perfil (nombre, rango, etc.)
  } else {
    // No hay usuario, lo regresamos al login inmediatamente
    console.warn("Intento de acceso no autorizado. Redirigiendo...");
    window.location.href = "login.html"; // Asegúrate de que este sea el nombre de tu archivo de login
  }
});