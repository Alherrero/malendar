// VARIABLES GLOBALES
let machines = [];
let currentFilter = 'all';
let editingMachineId = null;
let currentRating = 0;

// CARGAR DATOS AL INICIAR
document.addEventListener('DOMContentLoaded', () => {
    loadMachines();
    updateStats();
    renderMachines();
});

// GUARDAR Y CARGAR DEL LOCALSTORAGE
function saveMachines() {
    localStorage.setItem('htb-machines', JSON.stringify(machines));
}

function loadMachines() {
    const stored = localStorage.getItem('htb-machines');
    if (stored) {
        machines = JSON.parse(stored);
    }
}

// ABRIR MODAL DE AÑADIR MÁQUINA
function openAddMachineModal() {
    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('machine-date').value = today;
    
    // Limpiar campos
    document.getElementById('machine-name').value = '';
    document.getElementById('machine-description').value = '';
    document.getElementById('machine-concepts').value = '';
    
    document.getElementById('add-machine-modal').classList.remove('hidden');
    document.getElementById('add-machine-modal').classList.add('flex');
}

// CERRAR MODAL DE AÑADIR MÁQUINA
function closeAddMachineModal() {
    document.getElementById('add-machine-modal').classList.add('hidden');
    document.getElementById('add-machine-modal').classList.remove('flex');
}

// AÑADIR NUEVA MÁQUINA
function addMachine() {
    const name = document.getElementById('machine-name').value.trim();
    const platform = document.getElementById('machine-platform').value;
    const date = document.getElementById('machine-date').value;
    const difficulty = document.getElementById('machine-difficulty').value;
    const os = document.getElementById('machine-os').value;
    const status = document.getElementById('machine-status').value;
    const description = document.getElementById('machine-description').value.trim();
    const concepts = document.getElementById('machine-concepts').value.trim();

    if (!name) {
        alert('⚠️ Por favor, ingresa el nombre de la máquina');
        return;
    }

    const machine = {
        id: Date.now(),
        name,
        platform,
        date: date || new Date().toISOString().split('T')[0],
        difficulty,
        os,
        status,
        description,
        concepts: concepts.split(',').map(c => c.trim()).filter(c => c),
        rating: 0,
        opinion: '',
        createdAt: Date.now()
    };

    machines.unshift(machine);
    saveMachines();
    
    updateStats();
    renderMachines();
    closeAddMachineModal();
    
    // Scroll suave al grid
    document.getElementById('machines-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// RENDERIZAR MÁQUINAS
function renderMachines() {
    const grid = document.getElementById('machines-grid');
    const emptyState = document.getElementById('empty-state');
    
    let filteredMachines = machines;
    
    // Aplicar filtro de estado
    if (currentFilter !== 'all') {
        filteredMachines = machines.filter(m => m.status === currentFilter);
    }
    
    // Aplicar búsqueda
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    if (searchTerm) {
        filteredMachines = filteredMachines.filter(m => 
            m.name.toLowerCase().includes(searchTerm) ||
            m.concepts.some(c => c.toLowerCase().includes(searchTerm)) ||
            m.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filteredMachines.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    grid.innerHTML = filteredMachines.map(machine => `
        <div class="machine-card rounded-xl p-5">
            <!-- Header -->
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h3 class="font-display font-black text-lg text-htb-green uppercase tracking-tight mb-1">${machine.name}</h3>
                    <p class="text-[10px] text-slate-400 uppercase tracking-wider">${machine.platform}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="status-badge status-${machine.status}">
                        ${getStatusText(machine.status)}
                    </span>
                    <button onclick="openMachineModal(${machine.id})" class="text-htb-green hover:text-htb-green/80 text-xl transition-all hover:scale-110" title="Editar máquina">
                        ✏️
                    </button>
                </div>
            </div>
            
            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div class="flex items-center gap-2">
                    <span class="diff-${machine.difficulty.toLowerCase()}">${getDifficultyIcon(machine.difficulty)}</span>
                    <span class="text-slate-400">${machine.difficulty}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span>${getOSIcon(machine.os)}</span>
                    <span class="text-slate-400">${machine.os}</span>
                </div>
            </div>
            
            ${machine.description ? `
                <p class="text-xs text-slate-400 mb-3 line-clamp-2">${machine.description}</p>
            ` : ''}
            
            <!-- Conceptos -->
            ${machine.concepts.length > 0 ? `
                <div class="mb-3 flex flex-wrap gap-1">
                    ${machine.concepts.slice(0, 3).map(concept => `
                        <span class="concept-tag">${concept}</span>
                    `).join('')}
                    ${machine.concepts.length > 3 ? `
                        <span class="concept-tag">+${machine.concepts.length - 3}</span>
                    ` : ''}
                </div>
            ` : ''}
            
            <!-- Rating y Fecha -->
            <div class="flex justify-between items-center pt-3 border-t border-htb-green/10">
                <div class="flex items-center gap-1">
                    ${renderStars(machine.rating)}
                </div>
                <span class="text-[10px] text-slate-500">${formatDate(machine.date)}</span>
            </div>
        </div>
    `).join('');
}

// ABRIR MODAL DE MÁQUINA
function openMachineModal(id) {
    const machine = machines.find(m => m.id === id);
    if (!machine) return;
    
    editingMachineId = id;
    currentRating = machine.rating;
    
    document.getElementById('modal-title').textContent = machine.name;
    document.getElementById('modal-platform').textContent = `📍 ${machine.platform}`;
    
    document.getElementById('edit-difficulty').value = machine.difficulty;
    document.getElementById('edit-os').value = machine.os;
    document.getElementById('edit-date').value = machine.date;
    document.getElementById('edit-status').value = machine.status;
    document.getElementById('edit-description').value = machine.description;
    document.getElementById('edit-concepts').value = machine.concepts.join(', ');
    document.getElementById('edit-opinion').value = machine.opinion;
    
    updateStarDisplay();
    
    document.getElementById('machine-modal').classList.remove('hidden');
    document.getElementById('machine-modal').classList.add('flex');
}

// CERRAR MODAL
function closeMachineModal() {
    document.getElementById('machine-modal').classList.add('hidden');
    document.getElementById('machine-modal').classList.remove('flex');
    editingMachineId = null;
    currentRating = 0;
}

// GUARDAR EDICIÓN
function saveMachineEdit() {
    const machine = machines.find(m => m.id === editingMachineId);
    if (!machine) return;
    
    machine.difficulty = document.getElementById('edit-difficulty').value;
    machine.os = document.getElementById('edit-os').value;
    machine.date = document.getElementById('edit-date').value;
    machine.status = document.getElementById('edit-status').value;
    machine.description = document.getElementById('edit-description').value.trim();
    machine.concepts = document.getElementById('edit-concepts').value
        .split(',')
        .map(c => c.trim())
        .filter(c => c);
    machine.opinion = document.getElementById('edit-opinion').value.trim();
    machine.rating = currentRating;
    
    saveMachines();
    updateStats();
    renderMachines();
    closeMachineModal();
}

// ELIMINAR MÁQUINA
function deleteMachine() {
    if (!confirm('⚠️ ¿Estás seguro de eliminar esta máquina?')) return;
    
    machines = machines.filter(m => m.id !== editingMachineId);
    saveMachines();
    updateStats();
    renderMachines();
    closeMachineModal();
}

// RATING SYSTEM
function setRating(rating) {
    currentRating = rating;
    updateStarDisplay();
}

function updateStarDisplay() {
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach((star, index) => {
        if (index < currentRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// FILTROS
function filterMachines(filter) {
    currentFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderMachines();
}

// BÚSQUEDA
function searchMachines() {
    renderMachines();
}

// ACTUALIZAR ESTADÍSTICAS
function updateStats() {
    const total = machines.length;
    const pwned = machines.filter(m => m.status === 'pwned').length;
    const pending = machines.filter(m => m.status === 'pending').length;
    
    document.getElementById('total-machines').textContent = total;
    document.getElementById('pwned-machines').textContent = pwned;
    document.getElementById('pending-machines').textContent = pending;
}

// HELPER FUNCTIONS
function getStatusText(status) {
    const statusMap = {
        'pending': '⏳ Pendiente',
        'in-progress': '🔄 En Progreso',
        'pwned': '✅ Pwned'
    };
    return statusMap[status] || status;
}

function getDifficultyIcon(difficulty) {
    const iconMap = {
        'Easy': '🟢',
        'Medium': '🟡',
        'Hard': '🔴',
        'Insane': '⚫'
    };
    return iconMap[difficulty] || '⚪';
}

function getOSIcon(os) {
    const iconMap = {
        'Linux': '🐧',
        'Windows': '🪟',
        'Otros': '🔧'
    };
    return iconMap[os] || '💻';
}

function renderStars(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        if (i < rating) {
            stars += '';
        } else {
            stars += '';
        }
    }
    return stars;
}

function formatDate(dateString) {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString + 'T00:00:00');
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

// KEYBOARD SHORTCUTS
document.addEventListener('keydown', (e) => {
    // ESC para cerrar modales
    if (e.key === 'Escape') {
        closeMachineModal();
        closeAddMachineModal();
        closeSettingsModal();
    }
    
    // Ctrl/Cmd + K para focus en búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input').focus();
    }
});

// ===== CONFIGURACIÓN Y EXPORTAR/IMPORTAR =====

// ABRIR MODAL DE CONFIGURACIÓN
function openSettingsModal() {
    updateSettingsStats();
    document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('settings-modal').classList.add('flex');
}

// CERRAR MODAL DE CONFIGURACIÓN
function closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('settings-modal').classList.remove('flex');
}

// ACTUALIZAR ESTADÍSTICAS DEL MODAL
function updateSettingsStats() {
    const total = machines.length;
    const dataSize = new Blob([JSON.stringify(machines)]).size;
    const sizeKB = (dataSize / 1024).toFixed(2);
    
    document.getElementById('stats-total').textContent = total;
    document.getElementById('stats-size').textContent = sizeKB + ' KB';
}

// EXPORTAR DATOS
function exportData() {
    if (machines.length === 0) {
        alert('⚠️ No hay datos para exportar');
        return;
    }
    
    const dataStr = JSON.stringify(machines, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    
    const date = new Date().toISOString().split('T')[0];
    link.download = `machine-calendar-backup-${date}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('✅ Datos exportados correctamente');
}

// IMPORTAR DATOS
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        alert('⚠️ Por favor selecciona un archivo JSON válido');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validar que sea un array
            if (!Array.isArray(importedData)) {
                throw new Error('El archivo no contiene un array válido');
            }
            
            // Confirmar antes de sobrescribir
            const confirmMsg = `⚠️ Esto reemplazará tus ${machines.length} máquinas actuales con ${importedData.length} máquinas del archivo.\n\n¿Estás seguro?`;
            if (!confirm(confirmMsg)) {
                event.target.value = ''; // Reset input
                return;
            }
            
            machines = importedData;
            saveMachines();
            updateStats();
            updateSettingsStats();
            renderMachines();
            
            alert(`✅ Datos importados correctamente\n${importedData.length} máquinas cargadas`);
            event.target.value = ''; // Reset input
            
        } catch (error) {
            alert('❌ Error al importar el archivo: ' + error.message);
            event.target.value = ''; // Reset input
        }
    };
    
    reader.readAsText(file);
}

// BORRAR TODOS LOS DATOS
function deleteAllData() {
    if (machines.length === 0) {
        alert('⚠️ No hay datos para borrar');
        return;
    }
    
    const confirmMsg = `⚠️ ADVERTENCIA: Esto borrará permanentemente todas tus ${machines.length} máquinas.\n\nEsta acción NO se puede deshacer.\n\n¿Estás ABSOLUTAMENTE seguro?`;
    
    if (!confirm(confirmMsg)) return;
    
    // Doble confirmación
    const doubleConfirm = confirm('🚨 ÚLTIMA CONFIRMACIÓN\n\n¿Realmente quieres borrar TODOS los datos?');
    if (!doubleConfirm) return;
    
    machines = [];
    saveMachines();
    updateStats();
    updateSettingsStats();
    renderMachines();
    
    alert('✅ Todos los datos han sido eliminados');
}