// Importamos los módulos necesarios de Firebase directamente desde su CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Tu configuración exacta obtenida de la consola del S.I.C.
const firebaseConfig = {
  apiKey: "AIzaSyC3_0yDBxL-lJY0lP8E6_EN2WfbSccEwRg",
  authDomain: "sic-terminal-db.firebaseapp.com",
  projectId: "sic-terminal-db",
  storageBucket: "sic-terminal-db.firebasestorage.app",
  messagingSenderId: "201434637004",
  appId: "1:201434637004:web:d6909ea34f22b50a079869"
};

// Inicializamos la aplicación y exportamos Auth y Base de Datos para usarlos en el Login
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);