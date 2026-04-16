// OJO: Asegúrate de que la ruta de importación de firebase-config.js sea la correcta
import { auth, db } from '../JS/firebase-config.js'; 
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Referencias a los elementos de tu HTML
const userNameSpan = document.querySelector('.user-name');
const userRoleSpan = document.querySelector('.user-role');
const btnLogout = document.getElementById('btn-logout');

// 1. LÓGICA PARA CERRAR SESIÓN
btnLogout.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log("Sesión cerrada exitosamente");
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
});

// 2. LÓGICA DE SEGURIDAD Y CARGA DE PERFIL
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        
        try {
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                userNameSpan.innerText = data.nombre.toUpperCase(); 
                userRoleSpan.innerText = data.rango_oficial;        
            } else {
                console.warn("No se encontró información del perfil en Firestore.");
                userNameSpan.innerText = "OFICIAL DESCONOCIDO";
            }
            
            // Llamamos a la función de las tarjetas
            window.cargarExpedientes();

        } catch (error) {
            console.error("Error al obtener perfil:", error);
        }
    } else {
        window.location.replace("../login.html"); 
    }
});

// 3. FUNCIÓN PARA CARGAR LAS TARJETAS AL HTML
window.cargarExpedientes = async function() {
    const gridCriminales = document.querySelector('.criminals-grid');
    if(gridCriminales) gridCriminales.innerHTML = "";

    try {
        const querySnapshot = await getDocs(collection(db, "criminales"));

        if (querySnapshot.empty) {
            console.log("Advertencia: La colección 'criminales' está vacía.");
            gridCriminales.innerHTML = "<p style='color: white; text-align: center; width: 100%;'>Archivero vacío.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const criminal = doc.data(); 
            const tarjeta = `
                <article class="criminal-card">
                    <div class="card-img" style="background-image: url('${criminal.foto_url}');"></div>
                    <div class="card-content">
                        <span style="font-size: 0.8rem; color: #888; font-family: monospace;">EXP: ${criminal.numero_expediente}</span>
                        <h3>${criminal.alias}</h3>
                        <p class="real-name">${criminal.nombre}</p>
                        <div class="status-tags">
                            <span class="tag-status ${criminal.estado === 'Fallecida' || criminal.estado === 'Fallecido' ? 'status-red' : 'status-orange'}">${criminal.estado}</span>
                            <span class="tag-threat threat-orange">${criminal.nivel_amenaza}</span>
                        </div>
                        <button class="btn-view" onclick="verDetalle('${doc.id}')">VER EXPEDIENTE</button>
                    </div>
                </article>
            `;
            gridCriminales.innerHTML += tarjeta;
        }); 
    } catch (error) {
        console.error("Error al cargar los datos desde Firebase:", error);
    }
};

// 4. FUNCIÓN PARA VER DETALLES (VENTANA EMERGENTE ACTUALIZADA CON VELOCÍMETRO)
window.verDetalle = async function(idDocumento) {
    try {
        const docRef = doc(db, "criminales", idDocumento); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const datos = docSnap.data();

            // 1. Cabecera y Columna Izquierda (Foto e Identidad)
            const expNum = document.getElementById('modal-exp-num');
            if(expNum) expNum.innerText = `EXP: ${datos.numero_expediente || '000'}`;
            
            document.getElementById('modal-img').style.backgroundImage = `url('${datos.foto_url}')`;
            document.getElementById('modal-alias').innerText = datos.alias ? `"${datos.alias.toUpperCase()}"` : "SIN ALIAS";
            document.getElementById('modal-nombre').innerText = datos.nombre.toUpperCase();
            
            // Estado
            const estadoSpan = document.getElementById('modal-estado-valor');
            estadoSpan.innerText = datos.estado || 'DESCONOCIDO';
            estadoSpan.style.color = (datos.estado === 'Fallecida' || datos.estado === 'Fallecido') ? '#e74c3c' : '#f1c40f'; 

            // Datos obligatorios debajo de la foto
            document.getElementById('modal-tipo').innerText = datos.tipo_asesino || "N/A";
            document.getElementById('modal-perfil').innerText = datos.perfil || "N/A";
            document.getElementById('modal-caracteristicas').innerText = datos.caracteristicas || "N/A";

            // --- LÓGICA DEL VELOCÍMETRO (MEDIDOR DE AMENAZA) ---
            // Obtenemos el valor y le quitamos los acentos y mayúsculas (ej. "Crítico" -> "critico")
            const threatLevelRaw = datos.nivel_amenaza || '';
            const threatLevel = threatLevelRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            
            const gaugeFill = document.getElementById('modal-gauge-fill');
            const threatText = document.getElementById('modal-threat-text');
            
            if (threatText) threatText.innerText = datos.nivel_amenaza || 'DESCONOCIDO';

            // Reseteamos el medidor a cero real (-135deg)
            if (gaugeFill) {
                gaugeFill.style.transform = "rotate(-135deg)"; 
                gaugeFill.style.borderTopColor = "#222";
                gaugeFill.style.borderLeftColor = "#222";
            }
            if (threatText) threatText.style.color = "#888";

            // Animación de llenado con los ángulos correctos
            setTimeout(() => {
                if (!gaugeFill) return;
                switch (threatLevel) {
                    case 'critico': 
                        gaugeFill.style.borderTopColor = "#e74c3c"; // Rojo
                        gaugeFill.style.borderLeftColor = "#e74c3c";
                        gaugeFill.style.transform = "rotate(45deg)"; // 100% LLENO
                        threatText.style.color = "#e74c3c";
                        break;
                    case 'alto': 
                        gaugeFill.style.borderTopColor = "#e67e22"; // Naranja
                        gaugeFill.style.borderLeftColor = "#e67e22";
                        gaugeFill.style.transform = "rotate(0deg)"; // 75%
                        threatText.style.color = "#e67e22";
                        break;
                    case 'medio': 
                        gaugeFill.style.borderTopColor = "#f1c40f"; // Amarillo
                        gaugeFill.style.borderLeftColor = "#f1c40f";
                        gaugeFill.style.transform = "rotate(-45deg)"; // 50% (A la mitad)
                        threatText.style.color = "#f1c40f";
                        break;
                    case 'bajo': 
                        gaugeFill.style.borderTopColor = "#2ecc71"; // Verde
                        gaugeFill.style.borderLeftColor = "#2ecc71";
                        gaugeFill.style.transform = "rotate(-90deg)"; // 25%
                        threatText.style.color = "#2ecc71";
                        break;
                    default: 
                        gaugeFill.style.transform = "rotate(-135deg)"; // 0%
                        threatText.style.color = "#888";
                        break;
                }
            }, 150);

            // 2. Columna Derecha (Textos Largos)
            document.getElementById('modal-psicosocial').innerText = datos.perfil_psicosocial || "Información clasificada o no disponible.";
            document.getElementById('modal-resena').innerText = datos.resena_delictiva || "Información clasificada o no disponible.";
            document.getElementById('modal-dinamica').innerText = datos.dinamica_delictiva || "Información clasificada o no disponible.";
            document.getElementById('modal-motivacion').innerText = datos.motivacion || "Información clasificada o no disponible.";
            
            // 3. Barra de víctimas (que ahora está dentro del scroll)
            document.getElementById('modal-victimas').innerText = datos.victimas || '0';

            // Abrimos el modal
            document.getElementById('modal-expediente').style.display = 'flex';

        } else {
            alert("El expediente ha sido clasificado o no existe.");
        }
    } catch (error) {
        console.error("Error al obtener los detalles:", error);
    }
};

// 5. LÓGICA PARA CERRAR LA VENTANA EMERGENTE
window.cerrarModal = function() {
    document.getElementById('modal-expediente').style.display = 'none';
};