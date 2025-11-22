// Sistema de sonidos para la tragamonedas
// Usando Web Audio API para generar tonos

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterVolume = 0.3; // Volumen moderado
    this.init();
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API no soportada');
    }
  }

  // Función auxiliar para crear un tono
  playTone(frequency, duration, type = 'sine', volume = 1.0) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(this.masterVolume * volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Sonido de giro de rodillos (efecto mecánico)
  playSpinSound() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Crear ruido blanco filtrado para simular rodillos
    const bufferSize = this.audioContext.sampleRate * 0.8;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(this.masterVolume * 0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    noise.start(now);
    noise.stop(now + 0.8);
  }

  // Sonido de click de palanca
  playLeverSound() {
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  // Sonido de victoria normal
  playWinSound() {
    if (!this.audioContext) return;
    
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.4);
      }, i * 100);
    });
  }

  // Sonido de gran victoria (jackpot)
  playBigWinSound() {
    if (!this.audioContext) return;
    
    // Secuencia ascendente triunfal
    const notes = [
      261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50
    ]; // C4 a C6
    
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', 0.5);
      }, i * 80);
    });

    // Acorde final
    setTimeout(() => {
      this.playTone(523.25, 0.8, 'sine', 0.6);
      this.playTone(659.25, 0.8, 'sine', 0.6);
      this.playTone(783.99, 0.8, 'sine', 0.6);
    }, 600);
  }

  // Sonido de pérdida
  playLossSound() {
    if (!this.audioContext) return;
    
    const notes = [392.00, 329.63, 261.63]; // G4, E4, C4 (descendente)
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.25, 'sine', 0.3);
      }, i * 120);
    });
  }

  // Sonido de monedas cayendo
  playCoinSound() {
    if (!this.audioContext) return;
    
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const freq = 800 + Math.random() * 400;
        this.playTone(freq, 0.05, 'sine', 0.2);
      }, i * 50);
    }
  }

  // Sonido de detención de rodillo (click suave)
  playReelStopSound() {
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(this.masterVolume * 0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }
}

// Crear instancia global
const soundManager = new SoundManager();
