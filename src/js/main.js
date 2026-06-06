import '../styles/main.scss';
import { initPreloader }   from './preloader.js';
import { initMatrixRain }  from './matrix-rain.js';
import { initTileEffect }  from './tiles.js';
import { initDtekApp }     from './dtek-app.js';
import { initBoardApp }    from './board-app.js';
import { initLiveRevealer } from './live-revealer.js';
import { init3DScene }     from './scene3d.js';

// ─── Boot sequence ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  // 0. Initialize language toggle early
  initLanguageSwitcher();

  // 1. Show preloader and wait for it to finish
  await initPreloader();
  document.body.classList.add('app-loaded');

  // 2. Start background effects
  initMatrixRain();
  initTileEffect();
  init3DScene();

  // 3. DTEK mini-app
  initDtekApp();

  // 4. Smart Board App
  initBoardApp();

  // 5. Reveal trigger controller
  initLiveRevealer();

  // 6. ASCII name decode animation
  animateAsciiName();

  // 7. Custom cursor
  initCursor();

  // 8. Header scroll compactor
  initHeaderScroll();

  // 9. Scroll-reveal for sections
  initScrollReveal();
});

// ─── Language Switcher ───────────────────────────────────────────────────────
function initLanguageSwitcher() {
  const savedLang = localStorage.getItem('app-lang') || 'ua';
  document.documentElement.setAttribute('lang', savedLang);

  const checkbox = document.getElementById('lang-checkbox');
  if (checkbox) {
    checkbox.checked = (savedLang === 'en');
    checkbox.addEventListener('change', () => {
      const targetLang = checkbox.checked ? 'en' : 'ua';
      localStorage.setItem('app-lang', targetLang);
      document.documentElement.setAttribute('lang', targetLang);
      
      // Notify other modules of the language change
      window.dispatchEvent(new CustomEvent('lang-changed', { detail: targetLang }));
    });
  }
}

// ─── ASCII Name glitch/decode reveal ─────────────────────────────────────────
function animateAsciiName() {
  const nameEl    = document.getElementById('ascii-name');
  const surnameEl = document.getElementById('ascii-surname');

  [nameEl, surnameEl].forEach((el, idx) => {
    if (!el) return;
    const original = el.textContent;
    const CHARS    = '01アイウエオカキ▓▒░█';
    let step = 0;
    const totalSteps = 18;
    const delay = idx * 300; // surname starts 300ms after name

    setTimeout(() => {
      const interval = setInterval(() => {
        step++;
        const ratio = step / totalSteps;
        // Gradually reveal original characters
        el.textContent = original
          .split('')
          .map((ch, i) => {
            if (ch === '\n' || ch === ' ') return ch;
            const charRevealPoint = i / original.length;
            if (charRevealPoint < ratio) return ch; // revealed
            return CHARS[Math.floor(Math.random() * CHARS.length)]; // still scrambled
          })
          .join('');

        if (step >= totalSteps) {
          clearInterval(interval);
          el.textContent = original; // restore exactly
        }
      }, 60);
    }, delay);
  });
}

// ─── Custom Cursor ────────────────────────────────────────────────────────────
function initCursor() {
  const cursor = document.getElementById('custom-cursor');
  const glow   = document.getElementById('custom-cursor-glow');
  if (!cursor || !glow) return;

  let mx = 0, my = 0;
  let cx = 0, cy = 0;
  let gx = 0, gy = 0;

  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });

  const hoverEls = document.querySelectorAll('a, button, .contact-card, .case-card, .btn-cv');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1.6)';
      cursor.style.backgroundColor = '#00e676';
      glow.style.transform = 'translate(-50%,-50%) scale(1.4)';
      glow.style.borderColor = 'rgba(0,230,118,0.4)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      cursor.style.backgroundColor = '#00ff41';
      glow.style.transform = 'translate(-50%,-50%) scale(1)';
      glow.style.borderColor = 'rgba(0,255,65,0.25)';
    });
  });

  (function loop() {
    cx += (mx - cx) * 0.25;
    cy += (my - cy) * 0.25;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';

    gx += (mx - gx) * 0.1;
    gy += (my - gy) * 0.1;
    glow.style.left = gx + 'px';
    glow.style.top  = gy + 'px';

    requestAnimationFrame(loop);
  })();
}

// ─── Header shrink on scroll ──────────────────────────────────────────────────
function initHeaderScroll() {
  const header = document.querySelector('.main-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.padding    = '0.6rem 1.5rem';
      header.style.background = 'rgba(8, 9, 12, 0.92)';
      header.style.boxShadow  = '0 8px 30px rgba(0,0,0,0.5)';
    } else {
      header.style.padding    = '1rem 2rem';
      header.style.background = 'rgba(14, 17, 24, 0.85)';
      header.style.boxShadow  = 'none';
    }
  });
}

// ─── Scroll reveal ────────────────────────────────────────────────────────────
function initScrollReveal() {
  const sections = document.querySelectorAll('.section');
  sections.forEach((sec, i) => {
    if (i === 0) return; // hero always visible
    sec.style.opacity   = '0';
    sec.style.transform = 'translateY(24px)';
    sec.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
  });

  const reveal = () => {
    sections.forEach(sec => {
      if (sec.getBoundingClientRect().top < window.innerHeight * 0.85) {
        sec.style.opacity   = '1';
        sec.style.transform = 'translateY(0)';
      }
    });
  };
  window.addEventListener('scroll', reveal, { passive: true });
  reveal();
}
