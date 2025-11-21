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

// === FUNCIONES DE EFECTOS VISUALES ===

// Crear confeti
function createConfetti(count) {
  const colors = ['#ab925c', '#FF6347', '#00FF00', '#1E90FF', '#FF69B4', '#FFA500'];

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      confetti.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 4000);
    }, i * 30);
  }
}

// Crear flash dorado
function createFlash() {
  const flash = document.createElement('div');
  flash.className = 'golden-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 600);
}

// Crear overlay de celebración
function createCelebrationOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'celebration-overlay';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 800);
}

// Crear texto de gran victoria
function createBigWinText(text) {
  const bigWin = document.createElement('div');
  bigWin.className = 'big-win-text';
  bigWin.textContent = text;
  document.body.appendChild(bigWin);
  setTimeout(() => bigWin.remove(), 2000);
}

// Crear overlay de pérdida
function createLossOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'loss-overlay';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 800);
}

// Crear texto de pérdida
function createLossText() {
  const lossText = document.createElement('div');
  lossText.className = 'loss-text';
  lossText.textContent = '😞';
  document.body.appendChild(lossText);
  setTimeout(() => lossText.remove(), 1500);
}

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

  // OBTENER RESULTADO INMEDIATAMENTE (no esperar la animación)
  let serverData = null;
  const fetchPromise = fetch(`${API_URL}/spin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bet })
  })
    .then(res => res.json())
    .then(data => {
      serverData = data;
    })
    .catch(error => {
      console.error("Error al conectar con el servidor:", error);
      setStatus("⚠️ Error de conexión");
      balance += bet;
      updateBalance();
    });

  // Agregar clase spinning para activar animación de blur
  reels.forEach(reel => reel.classList.add("spinning"));

  // Iniciar animación de giro con efecto más fluido
  const spinPromises = reels.map((reel, reelIndex) => {
    return new Promise(resolve => {
      const symbols = reel.querySelectorAll('.symbol');
      let spinCount = 0;
      const maxSpins = 20 + (reelIndex * 10);

      const animationInterval = setInterval(() => {
        symbols.forEach(s => {
          s.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        });
        spinCount++;

        if (spinCount >= maxSpins) {
          clearInterval(animationInterval);
          reel.classList.remove("spinning");
          resolve();
        }
      }, 80);
    });
  });

  // Esperar a que TANTO la animación COMO el fetch terminen
  await Promise.all([...spinPromises, fetchPromise]);

  // Si no hay datos del servidor (error), terminar
  if (!serverData) {
    spinning = false;
    return;
  }

  // Mostrar resultado final (ahora los símbolos no cambiarán)
  reels.forEach((reel, reelIndex) => {
    const symbols = reel.querySelectorAll('.symbol');
    symbols.forEach((s, symbolIndex) => {
      s.textContent = serverData.grid[symbolIndex][reelIndex];
    });
  });

  // Efecto de victoria o pérdida
  if (serverData.win > 0) {
    balance += serverData.win;
    const winAmount = serverData.win;
    const isBigWin = winAmount >= bet * 5;

    if (isBigWin) {
      // GRAN VICTORIA
      setStatus(`🎊 ¡GRAN VICTORIA! +$${winAmount} 🎊`);

      document.querySelector('.slot-machine').classList.add('machine-shake-win');
      setTimeout(() => {
        document.querySelector('.slot-machine').classList.remove('machine-shake-win');
      }, 500);

      createFlash();
      createCelebrationOverlay();
      createBigWinText(`¡$${winAmount}!`);
      createConfetti(50);

      document.querySelector('.lights').classList.add('victory-lights');
      setTimeout(() => {
        document.querySelector('.lights').classList.remove('victory-lights');
      }, 3000);

    } else {
      // Victoria normal
      setStatus(`🎉 ¡GANASTE $${winAmount}!`);

      gridEl.parentElement.classList.add("win-effect");
      setTimeout(() => {
        gridEl.parentElement.classList.remove("win-effect");
      }, 500);

      createConfetti(20);
      createFlash();
    }

    highlightWinningLines(serverData.grid);

  } else {
    // PÉRDIDA
    setStatus("Intenta de nuevo...");

    createLossOverlay();

    document.querySelector('.slot-machine').classList.add('machine-shake-loss');
    setTimeout(() => {
      document.querySelector('.slot-machine').classList.remove('machine-shake-loss');
    }, 400);

    const symbols = document.querySelectorAll('.symbol');
    symbols.forEach(s => s.classList.add('symbol-dimmed'));
    setTimeout(() => {
      symbols.forEach(s => s.classList.remove('symbol-dimmed'));
    }, 800);

    createLossText();
  }

  updateBalance();
  spinning = false;

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
  const cells = document.querySelectorAll('.cell');
  let blinkCount = 0;
  const blinkInterval = setInterval(() => {
    cells.forEach((cell, i) => {
      if (blinkCount % 2 === 0) {
        cell.style.borderColor = '#ab925c';
        cell.style.boxShadow = '0 0 20px rgba(171, 146, 92, 0.8), inset 0 0 20px rgba(171, 146, 92, 0.3)';
      } else {
        cell.style.borderColor = '#8b7a4c';
        cell.style.boxShadow = 'inset 0 2px 4px rgba(171, 146, 92, 0.2), 0 4px 8px rgba(0, 0, 0, 0.5)';
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
