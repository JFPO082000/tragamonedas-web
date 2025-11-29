// Integración con Base de Datos
// Este archivo se carga DESPUÉS de app.js y agrega funcionalidad de BD

const API_URL_DB = window.location.origin;

// Sobrescribir balance inicial a 0
balance = 0;

// Función para cargar saldo desde BD
async function loadBalanceFromDB() {
    try {
        const response = await fetch(`${API_URL_DB}/api/saldo`, {
            credentials: 'include'  // Envía cookie de App Inventor
        });

        if (response.ok) {
            const data = await response.json();
            balance = data.saldo;
            updateBalance();
            console.log('✅ Saldo cargado desde BD:', balance);
        } else {
            console.log('⚠️ Sin autenticación, usando saldo por defecto');
        }
    } catch (error) {
        console.log('⚠️ Error cargando saldo:', error);
    }
}

// Sobrescribir función calculateWin para actualizar BD
const originalCalculateWin = window.calculateWin;
window.calculateWin = async function (grid, bet) {
    // Calcular ganancia localmente primero
    const win = originalCalculateWin(grid, bet);

    // Enviar al servidor para actualizar BD
    try {
        const response = await fetch(`${API_URL_DB}/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ bet: bet })
        });

        if (response.ok) {
            const data = await response.json();
            // Actualizar saldo desde el servidor
            balance = data.nuevo_saldo;
            return data.win;
        }
    } catch (error) {
        console.error('Error al actualizar BD:', error);
    }

    // Si falla, usar cálculo local
    return win;
};

// Cargar saldo al iniciar
loadBalanceFromDB();
