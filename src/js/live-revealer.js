/**
 * live-revealer.js
 * Manages premium interactive transitions for live portfolio demos.
 * Collapses and reveals target live apps using custom cascading grid triggers.
 */

export function initLiveRevealer() {
  const ctaButtons = document.querySelectorAll('.btn-case-cta');
  const closeButtons = document.querySelectorAll('.btn-close-demo');

  ctaButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      revealDemo(targetId);
    });
  });

  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      hideDemo(targetId);
    });
  });
}

function revealDemo(id) {
  const section = document.getElementById(id);
  if (!section) return;

  // 1. Cascading micro-glitch effect on tile lift canvas if available
  const tileCanvas = document.getElementById('tile-canvas');
  if (tileCanvas) {
    tileCanvas.style.transition = 'opacity 0.2s';
    tileCanvas.style.opacity = '0.8';
    setTimeout(() => { tileCanvas.style.opacity = '0.22'; }, 400);
  }

  // 2. Show section with a fade and scale transition
  section.style.display = 'block';
  section.style.opacity = '0';
  section.style.transform = 'translateY(40px) scale(0.98)';
  
  // Force reflow
  section.offsetHeight;

  section.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
  section.style.opacity = '1';
  section.style.transform = 'translateY(0) scale(1)';

  // 3. Smooth scroll down to view
  setTimeout(() => {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function hideDemo(id) {
  const section = document.getElementById(id);
  if (!section) return;

  section.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
  section.style.opacity = '0';
  section.style.transform = 'translateY(30px) scale(0.98)';

  // Return viewport to project card
  const caseId = id === 'dtek-live' ? 'case-card-dtek' : 'case-card-board';
  const card = document.getElementById(caseId);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  setTimeout(() => {
    section.style.display = 'none';
  }, 500);
}
