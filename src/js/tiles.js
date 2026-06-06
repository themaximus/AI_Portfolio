/**
 * tiles.js
 * Canvas-based 3D tile lift effect.
 * Tiles near the cursor appear to rise from the floor using
 * perspective projection drawn directly on a 2D canvas.
 */
export function initTileEffect() {
  const canvas = document.getElementById('tile-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const TILE   = 80;      // tile size in px
  const RADIUS = 220;     // mouse influence radius
  const MAX_LIFT = 36;    // maximum Z-lift in px (simulated)

  let mouseX = -9999;
  let mouseY = -9999;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  function drawTile(x, y, lift, strength) {
    if (lift < 0.5) return;

    // Simulate perspective: top edge shifts up by `lift`, left/right squish slightly
    const shiftX = (mouseX - (x + TILE / 2)) / RADIUS * lift * 0.4;
    const shiftY = -lift; // tiles lift toward camera (up on screen)

    // Draw top face (lifted parallelogram)
    ctx.beginPath();
    ctx.moveTo(x + shiftX,        y + shiftY);         // top-left lifted
    ctx.lineTo(x + TILE + shiftX, y + shiftY);         // top-right lifted
    ctx.lineTo(x + TILE,          y + TILE);            // bottom-right grounded
    ctx.lineTo(x,                 y + TILE);            // bottom-left grounded
    ctx.closePath();

    const alpha = strength * 0.08;
    ctx.fillStyle   = `rgba(0, 255, 65, ${alpha})`;
    ctx.fill();

    // Top edge glow
    ctx.strokeStyle = `rgba(0, 255, 65, ${strength * 0.55})`;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(x + shiftX,        y + shiftY);
    ctx.lineTo(x + TILE + shiftX, y + shiftY);
    ctx.stroke();

    // Left side edge (the "wall" showing depth)
    ctx.strokeStyle = `rgba(0, 180, 40, ${strength * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(x + shiftX, y + shiftY);
    ctx.lineTo(x,          y + TILE);
    ctx.stroke();

    // Right side edge
    ctx.beginPath();
    ctx.moveTo(x + TILE + shiftX, y + shiftY);
    ctx.lineTo(x + TILE,          y + TILE);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cols = Math.ceil(canvas.width  / TILE) + 1;
    const rows = Math.ceil(canvas.height / TILE) + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x  = c * TILE;
        const y  = r * TILE;
        const cx = x + TILE / 2;
        const cy = y + TILE / 2;

        const dx   = mouseX - cx;
        const dy   = mouseY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < RADIUS) {
          const strength = Math.pow(1 - dist / RADIUS, 1.8);
          const lift     = strength * MAX_LIFT;
          drawTile(x, y, lift, strength);
        }
      }
    }
  }

  // Animate at 60fps
  function loop() {
    draw();
    requestAnimationFrame(loop);
  }
  loop();
}
