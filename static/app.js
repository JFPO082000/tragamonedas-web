// Usar el origen actual del navegador (funciona local y en producción)
const API_URL = window.location.origin;

let balance = 500;
let autoSpin = false;
let spinning = false;

const gridEl = document.getElementById("grid");
const statusEl = document.getElementById("status");
const betInput = document.getElementById("bet");
const autoBtn = document.getElementById("autoBtn");
const balanceEl = document.getElementById("balance");
const leverContainer = document.getElementById("leverContainer");
const leverArm = document.getElementById("leverArm");

// Símbolos disponibles en el frontend
const SYMBOLS = ["❔", "🍒", "🍋", "🍇", "⭐", "7️⃣", "🔔"];

// Crear las 3 columnas (rodillos)
const reels = [];
for (let i = 0; i < 3; i++) {
  const reelContainer = document.createElement("div");
  reelContainer.className = "reel";

  // Cada rodillo tendrá 3 celdas visibles
  for (let j = 0; j < 3; j++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    const symbolDiv = document.createElement("div");
    symbolDiv.className = "symbol";
    symbolDiv.textContent = "❔";
    cell.appendChild(symbolDiv);
    reelContainer.appendChild(cell);
  }
  gridEl.appendChild(reelContainer);
  reels.push(reelContainer);
}

function updateBalance() {
  balanceEl.textContent = "$" + balance;
}

function setStatus(text) {
  statusEl.textContent = text;
}

// Animación de la palanca
function pullLever() {
  if (spinning) return;

  leverArm.classList.add("pulled");

  setTimeout(() => {
    leverArm.classList.remove("pulled");
    spinOnce();
  }, 300);
}

// Event listener para la palanca
leverContainer.addEventListener("click", pullLever);

async function spinOnce() {
  if (spinning) return;

  const bet = parseInt(betInput.value);

  if (bet > balance) {
    setStatus("💸 Saldo insuficiente");
    return;
  }

  spinning = true;
  setStatus("🎰 Girando...");
  balance -= bet;
  updateBalance();

  // Agregar clase spinning para activar animación de blur
  reels.forEach(reel => reel.classList.add("spinning"));

  // Iniciar animación de giro con efecto más fluido
  const spinPromises = reels.map((reel, reelIndex) => {
    return new Promise(resolve => {
      const symbols = reel.querySelectorAll('.symbol');
      let spinCount = 0;
      const maxSpins = 20 + (reelIndex * 10); // Más giros para rodillos más a la derecha

      const animationInterval = setInterval(() => {
        symbols.forEach(s => {
          s.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        });
        spinCount++;

        // Detener gradualmente
        if (spinCount >= maxSpins) {
          clearInterval(animationInterval);
          reel.classList.remove("spinning");
          resolve();
        }
      }, 80);
    });
  });

  // Esperar a que la animación "termine" visualmente antes de mostrar el resultado
  await Promise.all(spinPromises);

  // Obtener resultado del backend
  try {
    const res = await fetch(`${API_URL}/spin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bet })
    });

    const data = await res.json();

    // Mostrar resultado final
    reels.forEach((reel, reelIndex) => {
      const symbols = reel.querySelectorAll('.symbol');
      symbols.forEach((s, symbolIndex) => {
        s.textContent = data.grid[symbolIndex][reelIndex];
      });
    });

    // Efecto de victoria
    if (data.win > 0) {
      balance += data.win;
      setStatus(`🎉 ¡GANASTE $${data.win}!`);

      // Efecto visual de victoria
      gridEl.parentElement.classList.add("win-effect");
      setTimeout(() => {
        gridEl.parentElement.classList.remove("win-effect");
      }, 500);

      // Parpadeo de símbolos ganadores
      highlightWinningLines(data.grid);
    } else {
      setStatus("Sigue intentando...");
    }

    updateBalance();
  } catch (error) {
    console.error("Error al conectar con el servidor:", error);
    setStatus("⚠️ Error de conexión");
    balance += bet; // Devolver la apuesta
    updateBalance();
  }

  spinning = false;

  // Continuar auto-spin si está activado
  if (autoSpin && balance >= bet) {
    setTimeout(() => {
      pullLever();
    }, 1000);
  } else if (autoSpin && balance < bet) {
    autoSpin = false;
    autoBtn.querySelector('.auto-status').textContent = "OFF";
    setStatus("💸 Sin saldo para auto-spin");
  }
}

// Resaltar líneas ganadoras
function highlightWinningLines(grid) {
  // Simple efecto de parpadeo en todos los símbolos
  const cells = document.querySelectorAll('.cell');
  let blinkCount = 0;
  const blinkInterval = setInterval(() => {
    cells.forEach((cell, i) => {
      if (blinkCount % 2 === 0) {
        cell.style.borderColor = '#FFD700';
        cell.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 215, 0, 0.3)';
      } else {
        cell.style.borderColor = '#CC9900';
        cell.style.boxShadow = 'inset 0 2px 4px rgba(255, 215, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.5)';
      }
    });
    blinkCount++;
    if (blinkCount >= 6) {
      clearInterval(blinkInterval);
      cells.forEach(cell => {
        cell.style.borderColor = '';
        cell.style.boxShadow = '';
      });
    }
  }, 200);
}

// Toggle auto-spin
autoBtn.onclick = () => {
  autoSpin = !autoSpin;
  autoBtn.querySelector('.auto-status').textContent = autoSpin ? "ON" : "OFF";

  if (autoSpin) {
    autoBtn.style.background = "linear-gradient(145deg, #1a4d1a, #0d3d0d)";
    autoBtn.style.borderColor = "#00FF00";
    pullLever();
  } else {
    autoBtn.style.background = "";
    autoBtn.style.borderColor = "";
  }
};

// Inicializar
updateBalance();
setStatus("¡Buena suerte!");
