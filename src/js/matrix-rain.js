/**
 * matrix-rain.js
 * Continuous Matrix-style green digit waterfall on a fixed background canvas.
 * Pure Canvas 2D — zero Three.js, zero lag.
 */
export function initMatrixRain() {
  const canvas = document.getElementById('matrix-rain');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();

  // Hacker character pool — binary + digits + katakana-inspired glyphs
  const POOL = '01アイウエオカキクケコサシスセソ日月火水木ナニヌネノ234567890!@#$%^&*<>?/\\~';
  const FONT_SIZE = 14;

  let cols  = Math.floor(canvas.width / FONT_SIZE);
  let drops = Array.from({ length: cols }, () => Math.random() * -120);

  window.addEventListener('resize', () => {
    resize();
    cols  = Math.floor(canvas.width / FONT_SIZE);
    drops = Array.from({ length: cols }, () => 0);
  });

  function draw() {
    // Subtle fade — creates the luminous trail
    ctx.fillStyle = 'rgba(8, 9, 12, 0.045)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT_SIZE}px "Fira Code", monospace`;

    for (let i = 0; i < drops.length; i++) {
      const ch = POOL[Math.floor(Math.random() * POOL.length)];
      const x  = i * FONT_SIZE;
      const y  = drops[i] * FONT_SIZE;

      // Bright leading glyph, dimmer trail
      const roll = Math.random();
      if (roll > 0.97) {
        ctx.fillStyle = '#ffffff'; // rare bright white flash
      } else if (roll > 0.75) {
        ctx.fillStyle = '#00ff41'; // Matrix green
      } else {
        ctx.fillStyle = 'rgba(0, 160, 40, 0.5)'; // dim trail
      }

      ctx.fillText(ch, x, y);

      // Randomly reset column to top
      if (y > canvas.height && Math.random() > 0.974) {
        drops[i] = 0;
      }
      drops[i] += 0.55;
    }
  }

  // Run at ~30 fps — smooth but light on CPU
  setInterval(draw, 33);
}
