let malla = [];
// Usamos localStorage para guardar los ramos aprobados en el navegador
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

// 2. Función principal para actualizar toda la página
function actualizarInterfaz() {
    const tbody = document.getElementById('cuerpo-malla');
    const contenedorDisponibles = document.getElementById('lista-disponibles');
    let creditosTotales = 0;
    
    tbody.innerHTML = '';
    contenedorDisponibles.innerHTML = '';
    
    malla.forEach(ramo => {
        const estaAprobado = aprobados.includes(ramo.Sigla);
        
        // Sumar créditos si está aprobado
        if (estaAprobado && ramo.Creditos) {
            creditosTotales += parseInt(ramo.Creditos);
        }

        // Llenar la tabla principal
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;">
                <input type="checkbox" onchange="alternarAprobacion('${ramo.Sigla}', this.checked)" ${estaAprobado ? 'checked' : ''}>
            </td>
            <td><strong>${ramo.Sigla}</strong></td>
            <td>${ramo.Nombre}</td>
            <td>${ramo.Semestre_Ideal}</td>
            <td>${ramo.Prerrequisitos || '-'}</td>
            <td>${ramo.Creditos || 0}</td>
        `;
        tbody.appendChild(tr);

        // Lógica de prerrequisitos para los disponibles
        if (!estaAprobado) {
            let requisitosCumplidos = true;
            
            if (ramo.Prerrequisitos) {
                // Separar los requisitos por comas y limpiar espacios
                const prereqs = ramo.Prerrequisitos.split(',').map(p => p.trim());
                // Verificar si todos están en la lista de aprobados
                requisitosCumplidos = prereqs.every(req => aprobados.includes(req));
            }
            
            if (requisitosCumplidos) {
                const div = document.createElement('div');
                div.className = 'ramo-disponible';
                div.innerHTML = `<strong>${ramo.Sigla}</strong> - ${ramo.Nombre} <br><small>Semestre: ${ramo.Semestre_Ideal} | Créditos: ${ramo.Creditos || 0}</small>`;
                contenedorDisponibles.appendChild(div);
            }
        }
    });

    // Actualizar métrica
    document.getElementById('total-creditos').innerText = creditosTotales;
}

// 3. Función al marcar o desmarcar un ramo
function alternarAprobacion(sigla, isChecked) {
    if (isChecked) {
        if (!aprobados.includes(sigla)) aprobados.push(sigla);
    } else {
        aprobados = aprobados.filter(s => s !== sigla);
    }
    // Guardar en el navegador y actualizar
    localStorage.setItem('malla-aprobados', JSON.stringify(aprobados));
    actualizarInterfaz();
}