// OJO: Asegúrate de que la ruta de importación de firebase-config.js sea la correcta
import { auth, db } from '../JS/firebase-config.js'; 
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Referencias a los elementos de tu HTML
const userNameSpan = document.querySelector('.user-name');
const userRoleSpan = document.querySelector('.user-role');
const btnLogout = document.getElementById('btn-logout');

// 1. LÓGICA PARA CERRAR SESIÓN
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        try {
            await signOut(auth);
            console.log("Sesión cerrada exitosamente");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    });
}

// 2. LÓGICA DE SEGURIDAD Y CARGA DE PERFIL
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        
        try {
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if(userNameSpan) userNameSpan.innerText = data.nombre.toUpperCase(); 
                if(userRoleSpan) userRoleSpan.innerText = data.rango_oficial;        
            } else {
                console.warn("No se encontró información del perfil en Firestore.");
                if(userNameSpan) userNameSpan.innerText = "OFICIAL DESCONOCIDO";
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

// --- LÓGICA DE FILTROS TÁCTICOS ---
const btnBuscar = document.getElementById('btn-buscar');

if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
        // Capturamos lo que el usuario escribió y lo pasamos a minúsculas
        const filtros = {
            exp: document.getElementById('filtro-exp').value.trim().toLowerCase(),
            apodo: document.getElementById('filtro-apodo').value.trim().toLowerCase(),
            estado: document.getElementById('filtro-estado').value.toLowerCase(),
            amenaza: document.getElementById('filtro-amenaza').value.toLowerCase()
        };
        
        // Ejecutamos la carga enviando los filtros
        window.cargarExpedientes(filtros);
    });
}

// 3. FUNCIÓN PARA CARGAR LAS TARJETAS AL HTML (CON FILTROS INTEGRADOS)
window.cargarExpedientes = async function(filtros = { exp: '', apodo: '', estado: '', amenaza: '' }) {
    const gridCriminales = document.querySelector('.criminals-grid');
    if(gridCriminales) gridCriminales.innerHTML = "";

    try {
        const querySnapshot = await getDocs(collection(db, "criminales"));

        if (querySnapshot.empty) {
            console.log("Advertencia: La colección 'criminales' está vacía.");
            if(gridCriminales) gridCriminales.innerHTML = "<p style='color: #888; text-align: center; width: 100%;'>Archivero vacío.</p>";
            return;
        }

        let coincidencias = 0;

        querySnapshot.forEach((doc) => {
            const criminal = doc.data(); 
            
            // Pasamos los datos de Firebase a minúsculas para compararlos sin errores
            const bdExp = (criminal.numero_expediente || "").toLowerCase();
            const bdApodo = (criminal.alias || "").toLowerCase();
            const bdEstado = (criminal.estado || "").toLowerCase();
            const bdAmenaza = (criminal.nivel_amenaza || "").toLowerCase();

            // Descartamos si no coinciden con los filtros
            if (filtros.exp && !bdExp.includes(filtros.exp)) return; 
            if (filtros.apodo && !bdApodo.includes(filtros.apodo)) return;
            if (filtros.estado && !bdEstado.includes(filtros.estado)) return;
            if (filtros.amenaza && !bdAmenaza.includes(filtros.amenaza)) return;

            coincidencias++;

            // Usamos etiqueta <img> para que el CSS (object-fit) funcione
            const tarjeta = `
                <article class="criminal-card">
                    <img src="${criminal.foto_url}" class="card-img" alt="Foto de ${criminal.alias || 'criminal'}">
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
            if(gridCriminales) gridCriminales.innerHTML += tarjeta;
        }); 

        // Mensaje en caso de no encontrar criminales con esos filtros
        if (coincidencias === 0 && gridCriminales) {
            gridCriminales.innerHTML = `
                <div style="text-align: center; width: 100%; grid-column: 1 / -1; padding: 40px; border: 1px dashed #e74c3c; border-radius: 8px;">
                    <h3 style="color: #e74c3c; margin-bottom: 10px;">NO SE ENCONTRARON EXPEDIENTES</h3>
                    <p style="color: #888;">Modifique los parámetros de búsqueda e intente de nuevo.</p>
                </div>
            `;
        }

    } catch (error) {
        console.error("Error al cargar los datos desde Firebase:", error);
    }
};

// 4. FUNCIÓN PARA VER DETALLES (VENTANA EMERGENTE ACTUALIZADA)
window.verDetalle = async function(idDocumento) {
    try {
        const docRef = doc(db, "criminales", idDocumento); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const datos = docSnap.data();

            // 1. Cabecera y Columna Izquierda
            const expNum = document.getElementById('modal-exp-num');
            if(expNum) expNum.innerText = `EXP: ${datos.numero_expediente || '000'}`;
            
            document.getElementById('modal-img').src = datos.foto_url || '';
            document.getElementById('modal-alias').innerText = datos.alias ? `"${datos.alias.toUpperCase()}"` : "SIN ALIAS";
            document.getElementById('modal-nombre').innerText = datos.nombre.toUpperCase();
            
            // Estado
            const estadoSpan = document.getElementById('modal-estado-valor');
            estadoSpan.innerText = datos.estado || 'DESCONOCIDO';
            estadoSpan.style.color = (datos.estado === 'Fallecida' || datos.estado === 'Fallecido') ? '#e74c3c' : '#f1c40f'; 

            // Datos
            document.getElementById('modal-tipo').innerText = datos.tipo_asesino || "N/A";
            document.getElementById('modal-perfil').innerText = datos.perfil || "N/A";
            document.getElementById('modal-caracteristicas').innerText = datos.caracteristicas || "N/A";

            // Lógica del Velocímetro
            const threatLevelRaw = datos.nivel_amenaza || '';
            const threatLevel = threatLevelRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            
            const gaugeFill = document.getElementById('modal-gauge-fill');
            const threatText = document.getElementById('modal-threat-text');
            
            if (threatText) threatText.innerText = datos.nivel_amenaza || 'DESCONOCIDO';

            if (gaugeFill) {
                gaugeFill.style.transform = "rotate(-135deg)"; 
                gaugeFill.style.borderTopColor = "#222";
                gaugeFill.style.borderLeftColor = "#222";
            }
            if (threatText) threatText.style.color = "#888";

            setTimeout(() => {
                if (!gaugeFill) return;
                switch (threatLevel) {
                    case 'critico': 
                        gaugeFill.style.borderTopColor = "#e74c3c"; 
                        gaugeFill.style.borderLeftColor = "#e74c3c";
                        gaugeFill.style.transform = "rotate(45deg)"; 
                        threatText.style.color = "#e74c3c";
                        break;
                    case 'alto': 
                        gaugeFill.style.borderTopColor = "#e67e22"; 
                        gaugeFill.style.borderLeftColor = "#e67e22";
                        gaugeFill.style.transform = "rotate(0deg)"; 
                        threatText.style.color = "#e67e22";
                        break;
                    case 'medio': 
                        gaugeFill.style.borderTopColor = "#f1c40f"; 
                        gaugeFill.style.borderLeftColor = "#f1c40f";
                        gaugeFill.style.transform = "rotate(-45deg)"; 
                        threatText.style.color = "#f1c40f";
                        break;
                    case 'bajo': 
                        gaugeFill.style.borderTopColor = "#2ecc71"; 
                        gaugeFill.style.borderLeftColor = "#2ecc71";
                        gaugeFill.style.transform = "rotate(-90deg)"; 
                        threatText.style.color = "#2ecc71";
                        break;
                    default: 
                        gaugeFill.style.transform = "rotate(-135deg)"; 
                        threatText.style.color = "#888";
                        break;
                }
            }, 150);

            // 2. Columna Derecha (Textos Largos)
            document.getElementById('modal-psicosocial').innerText = datos.perfil_psicosocial || "Información clasificada o no disponible.";
            document.getElementById('modal-resena').innerText = datos.resena_delictiva || "Información clasificada o no disponible.";
            document.getElementById('modal-dinamica').innerText = datos.dinamica_delictiva || "Información clasificada o no disponible.";
            document.getElementById('modal-motivacion').innerText = datos.motivacion || "Información clasificada o no disponible.";
            
            // 3. Barra de víctimas
            document.getElementById('modal-victimas').innerText = datos.victimas || '0';

            // Abrir modal
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
