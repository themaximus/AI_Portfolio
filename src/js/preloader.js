/**
 * preloader.js
 * Binary rain preloader — skeleton screens + 0/1 waterfall + progress bar.
 * Returns a Promise that resolves when the preloader finishes.
 */
export function initPreloader() {
  return new Promise((resolve) => {
    const overlay  = document.getElementById('preloader');
    const canvas   = document.getElementById('preloader-canvas');
    const statusEl = document.getElementById('preloader-status');
    const barEl    = document.getElementById('preloader-bar');
    const pctEl    = document.getElementById('preloader-pct');

    if (!overlay || !canvas) { resolve(); return; }

    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // ── Binary rain setup ──────────────────────────────────────────────────
    const FONT_SIZE = 13;
    const cols = Math.floor(canvas.width / FONT_SIZE);
    // Start each column at a random negative y so rain arrives staggered
    const drops = Array.from({ length: cols }, () => Math.random() * -80);

    const CHARS = '01';

    function drawRain() {
      // Fade trail: semi-transparent black rect
      ctx.fillStyle = 'rgba(8, 9, 12, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px "Fira Code", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const ch = Math.random() > 0.5 ? '1' : '0';
        const x  = i * FONT_SIZE;
        const y  = drops[i] * FONT_SIZE;

        // Leading character is bright white, trail is green
        const roll = Math.random();
        if (roll > 0.97) {
          ctx.fillStyle = '#ffffff';
        } else if (roll > 0.6) {
          ctx.fillStyle = '#00ff41';
        } else {
          ctx.fillStyle = 'rgba(0, 180, 50, 0.55)';
        }

        ctx.fillText(ch, x, y);

        // Reset drop to top randomly
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.6;
      }
    }

    // ── Status messages ────────────────────────────────────────────────────
    const MESSAGES = [
      'SYSTEM BOOT...',
      'LOADING NEURAL MATRICES...',
      'COMPILING PORTFOLIO DATA...',
      'RENDERING INTERFACE...',
      'DECODING IDENTITY...',
      '█▓░ SYSTEM READY ░▓█',
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      if (statusEl && msgIdx < MESSAGES.length) {
        statusEl.textContent = MESSAGES[msgIdx++];
      }
    }, 450);

    // ── Progress animation ─────────────────────────────────────────────────
    const DURATION = 2800; // ms
    const startTime = performance.now();
    let animId;

    function tick() {
      const elapsed  = performance.now() - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      if (barEl) barEl.style.width  = `${eased * 100}%`;
      if (pctEl) pctEl.textContent  = `${Math.floor(eased * 100)}%`;

      drawRain();

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        clearInterval(msgInterval);
        if (statusEl) statusEl.textContent = '█▓░ SYSTEM READY ░▓█';
        setTimeout(fadeOut, 300);
      }
    }

    function fadeOut() {
      cancelAnimationFrame(animId);
      overlay.style.transition = 'opacity 0.9s ease';
      overlay.style.opacity    = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => {
        overlay.style.display = 'none';
        resolve();
      }, 920);
    }

    animId = requestAnimationFrame(tick);
  });
}
