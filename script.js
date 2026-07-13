let malla = [];
let aprobados = JSON.parse(localStorage.getItem('malla-aprobados')) || [];

// 1. Cargar el archivo CSV
fetch('malla.csv')
    .then(response => response.text())
    .then(csvText => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                malla = results.data;
                actualizarInterfaz();
            }
        });
    });

// 2. Función para procesar un clic en cualquier tarjeta
function alternarAprobacion(sigla) {
    if (aprobados.includes(sigla)) {
        aprobados = aprobados.filter(s => s !== sigla); // Desmarcar
    } else {
        aprobados.push(sigla); // Marcar como aprobado
    }
    localStorage.setItem('malla-aprobados', JSON.stringify(aprobados));
    actualizarInterfaz();
}

// 3. Renderizar la cuadrícula visual
function actualizarInterfaz() {
    const grid = document.getElementById('malla-grid');
    grid.innerHTML = '';
    let creditosTotales = 0;

    // Agrupar los ramos por la columna "Semestre_Ideal"
    const semestres = {};
    malla.forEach(ramo => {
        const sem = ramo.Semestre_Ideal || 'Otros';
        if (!semestres[sem]) semestres[sem] = [];
        semestres[sem].push(ramo);
    });

    // Ordenar los semestres del 1 en adelante
    const semestresOrdenados = Object.keys(semestres).sort((a, b) => parseInt(a) - parseInt(b));

    // Construir la interfaz columna por columna
    semestresOrdenados.forEach(sem => {
        const columnaDiv = document.createElement('div');
        columnaDiv.className = 'semestre-columna';
        
        const titulo = document.createElement('div');
        titulo.className = 'semestre-titulo';
        titulo.innerText = `Semestre ${sem}`;
        columnaDiv.appendChild(titulo);

        semestres[sem].forEach(ramo => {
            const estaAprobado = aprobados.includes(ramo.Sigla);
            
            if (estaAprobado && ramo.Creditos) {
                creditosTotales += parseInt(ramo.Creditos);
            }

            // Lógica de prerrequisitos
            let requisitosCumplidos = true;
            if (!estaAprobado && ramo.Prerrequisitos) {
                const prereqs = ramo.Prerrequisitos.split(',').map(p => p.trim());
                requisitosCumplidos = prereqs.every(req => aprobados.includes(req));
            }

            // Asignar estado CSS
            let claseEstado = 'estado-bloqueado';
            if (estaAprobado) claseEstado = 'estado-aprobado';
            else if (requisitosCumplidos) claseEstado = 'estado-disponible';

            // Crear la tarjeta del ramo
            const card = document.createElement('div');
            card.className = `ramo-card ${claseEstado}`;
            card.onclick = () => alternarAprobacion(ramo.Sigla);

            card.innerHTML = `
                <div class="ramo-sigla">${ramo.Sigla}</div>
                <div class="ramo-nombre">${ramo.Nombre}</div>
                <div class="ramo-creditos">${ramo.Creditos || 0} Créditos</div>
            `;
            columnaDiv.appendChild(card);
        });

        grid.appendChild(columnaDiv);
    });

    // Actualizar contador de créditos
    document.getElementById('total-creditos').innerText = creditosTotales;
}
