const API_URL = ""; 
// IMPORTANTE: aquí pega la URL de Render cuando lo subas.
// Ej: const API_URL = "https://mi-slot.onrender.com";

let balance = 500;
let autoSpin = false;
let spinning = false;

const gridEl = document.getElementById("grid");
const statusEl = document.getElementById("status");
const betInput = document.getElementById("bet");
const spinBtn = document.getElementById("spinBtn");
const autoBtn = document.getElementById("autoBtn");
const balanceEl = document.getElementById("balance");

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
  balanceEl.textContent = "Saldo: " + balance;
}

function setStatus(text) {
  statusEl.textContent = text;
}


async function spinOnce() {
  if (spinning) return;

  const bet = parseInt(betInput.value);

  if (bet > balance) {
    setStatus("Saldo insuficiente 💸");
    return;
  }

  spinning = true;
  setStatus("Girando...");
  balance -= bet;
  updateBalance();

  // Iniciar animación de giro
  const spinPromises = reels.map((reel, reelIndex) => {
    return new Promise(resolve => {
      const symbols = reel.querySelectorAll('.symbol');
      const animationInterval = setInterval(() => {
        symbols.forEach(s => {
          s.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        });
      }, 100);

      // Detener después de un tiempo
      setTimeout(() => {
        clearInterval(animationInterval);
        resolve();
      }, 1000 + reelIndex * 500); // Retraso escalonado
    });
  });

  // Esperar a que la animación "termine" visualmente antes de mostrar el resultado
  await Promise.all(spinPromises);

  // Mostrar resultado final
  const showResult = (grid) => {
    reels.forEach((reel, reelIndex) => {
      const symbols = reel.querySelectorAll('.symbol');
      symbols.forEach((s, symbolIndex) => {
        s.textContent = grid[symbolIndex][reelIndex];
      });
    });
  };
  
  const res = await fetch(`${API_URL}/spin`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ bet })
  });

  const data = await res.json();
  showResult(data.grid);

  if (data.win > 0) {
    balance += data.win;
    setStatus(`🎉 ¡Ganaste ${data.win}!`);
  } else {
    setStatus("Sigue intentando...");
  }

  updateBalance();
  spinning = false;

  if (autoSpin && balance > 0) {
    setTimeout(spinOnce, 500);
  }
}

spinBtn.onclick = () => {
  autoSpin = false;
  autoBtn.textContent = "Auto-Spin OFF";
  spinOnce();
};

autoBtn.onclick = () => {
  autoSpin = !autoSpin;
  autoBtn.textContent = autoSpin ? "Auto-Spin ON" : "Auto-Spin OFF";
  if (autoSpin) spinOnce();
};

updateBalance();
