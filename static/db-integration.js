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

// NOTA: La lógica de actualización de saldo está en app.js > spinOnce()
// que ya llama al endpoint /spin y actualiza correctamente el balance
// tanto para victorias como para pérdidas.

// Cargar saldo al iniciar
loadBalanceFromDB();
