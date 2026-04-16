import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const loginForm = document.querySelector('form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userField = document.getElementById('usuario').value;
    const passField = document.getElementById('password').value;
    const btn = document.querySelector('.btn-login');

    btn.innerText = "VERIFICANDO...";
    btn.disabled = true;

    try {
        // 1. Convertimos el username en el correo falso que registramos
        const emailFalso = `${userField}@sic.com`;

        // 2. Intentamos el login
        const userCredential = await signInWithEmailAndPassword(auth, emailFalso, passField);
        const user = userCredential.user;

        // 3. Si es exitoso, actualizamos la hora de acceso en Firestore
        const userRef = doc(db, "usuarios", user.uid);
        await updateDoc(userRef, {
            ultimo_acceso: new Date()
        });

        // 4. Redirigir al sistema central
        window.location.href = "Home/index.html"; 

    } catch (error) {
        console.error("Error de acceso:", error.code);
        alert("ACCESO DENEGADO: Credenciales no reconocidas por el S.I.C.");
        btn.innerText = "INICIAR SESIÓN";
        btn.disabled = false;
    }
});
