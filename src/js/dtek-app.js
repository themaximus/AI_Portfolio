/**
 * dtek-app.js  —  Web port of the DTEK Electron desktop widget.
 * Faithful 1-to-1 recreation: same logic, same settings structure,
 * same UI flow. Data fetched via local proxy-server.js (port 3001).
 */

const PROXY_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;

const REGIONS = {
  'https://www.dtek-dnem.com.ua/ua/shutdowns': 'Дніпро та область',
  'https://www.dtek-kem.com.ua/ua/shutdowns':  'Київ (місто)',
  'https://www.dtek-krem.com.ua/ua/shutdowns': 'Київська обл.',
  'https://www.dtek-oem.com.ua/ua/shutdowns':  'Одеська обл.',
  'https://www.dtek-dem.com.ua/ua/shutdowns':  'Донецька обл.',
};
const REGION_SHORT = {
  'https://www.dtek-dnem.com.ua/ua/shutdowns': 'Дніпро',
  'https://www.dtek-kem.com.ua/ua/shutdowns':  'Київ',
  'https://www.dtek-krem.com.ua/ua/shutdowns': 'Київ обл.',
  'https://www.dtek-oem.com.ua/ua/shutdowns':  'Одеса',
  'https://www.dtek-dem.com.ua/ua/shutdowns':  'Донецьк',
};
const QUEUES = [
  'GPV1.1','GPV1.2','GPV2.1','GPV2.2','GPV3.1','GPV3.2',
  'GPV4.1','GPV4.2','GPV5.1','GPV5.2','GPV6.1','GPV6.2',
];

// ── Persistent settings via localStorage ────────────────────────────────────
function loadSettings() {
  try { return JSON.parse(localStorage.getItem('dtek-settings') || '{}'); } catch { return {}; }
}
function saveSettings(patch) {
  const s = Object.assign(loadSettings(), patch);
  localStorage.setItem('dtek-settings', JSON.stringify(s));
  return s;
}

// ── State ────────────────────────────────────────────────────────────────────
let state = {
  group:     null,
  region:    'https://www.dtek-dnem.com.ua/ua/shutdowns',
  useAurora: false,
  useBlur:   false,
  selectedDay: 0,
  currentRawData: null,
  loading: false,
};

// ── Entry point ───────────────────────────────────────────────────────────────
export function initDtekApp() {
  const root = document.getElementById('dtek-app-root');
  if (!root) return;

  // Load persisted settings
  const saved = loadSettings();
  state.group     = saved.group  || null;
  state.region    = saved.region || 'https://www.dtek-dnem.com.ua/ua/shutdowns';
  state.useAurora = saved.useAurora || false;
  state.useBlur   = saved.useBlur   || false;

  renderShell(root);
  applyVisuals();

  if (!state.group || !state.region) {
    openSettings();
  } else {
    startUpdate();
  }

  // Auto-refresh every 5 minutes (same as desktop)
  setInterval(startUpdate, 300_000);
}

// ── Render the widget shell (static HTML, identical to desktop widget) ────────
function renderShell(root) {
  root.innerHTML = `
  <div class="dw-container" id="dw-container">

    <!-- Settings Overlay -->
    <div id="dw-overlay" class="dw-overlay">
      <div class="dw-overlay-title">Регіон / Місто</div>
      <select id="dw-region-select" class="dw-form-select">
        ${Object.entries(REGIONS).map(([v, l]) =>
          `<option value="${v}" ${v === state.region ? 'selected' : ''}>${l}</option>`
        ).join('')}
      </select>

      <div class="dw-overlay-title">Черга відключень</div>
      <select id="dw-group-select" class="dw-form-select">
        ${QUEUES.map(q =>
          `<option value="${q}" ${q === state.group ? 'selected' : ''}>${q.replace('GPV', 'Черга ')}</option>`
        ).join('')}
      </select>

      <button id="dw-save-btn" class="dw-btn-big dw-btn-save">ЗБЕРЕГТИ</button>
      <button id="dw-cancel-btn" class="dw-btn-big dw-btn-cancel" style="display:none">СКАСУВАТИ</button>

      <hr class="dw-divider">

      <div class="dw-overlay-title">Вигляд</div>

      <label class="dw-toggle-row">
        <div class="dw-toggle-label">
          Анімація фону
          <small>Підвищить навантаження на систему</small>
        </div>
        <div class="dw-toggle-switch">
          <input type="checkbox" id="dw-chk-aurora" ${state.useAurora ? 'checked' : ''}>
          <div class="dw-toggle-track"></div>
          <div class="dw-toggle-thumb"></div>
        </div>
      </label>

      <label class="dw-toggle-row">
        <div class="dw-toggle-label">
          Прозорість / розмиття
          <small>Підвищить навантаження на систему</small>
        </div>
        <div class="dw-toggle-switch">
          <input type="checkbox" id="dw-chk-blur" ${state.useBlur ? 'checked' : ''}>
          <div class="dw-toggle-track"></div>
          <div class="dw-toggle-thumb"></div>
        </div>
      </label>

      <div class="dw-author-info">
        Автор: Максим | <a href="https://t.me/etojemaximus" target="_blank" class="dw-author-link">@etojemaximus</a>
      </div>
    </div><!-- /overlay -->

    <!-- Widget Body -->
    <div class="dw-header">
      <h2 class="dw-title">Графік ДТЕК</h2>
      <div class="dw-header-actions">
        <div id="dw-refresh-btn" class="dw-icon-btn dw-refresh-btn" title="Оновити">↻</div>
        <div id="dw-settings-btn" class="dw-icon-btn" title="Налаштування">⚙</div>
        <div id="dw-group-tag" class="dw-group-badge">...</div>
      </div>
    </div>

    <div class="dw-day-toggle">
      <button class="dw-day-btn active" data-day="0">Сьогодні</button>
      <button class="dw-day-btn" data-day="1">Завтра</button>
    </div>

    <div class="dw-status-section">
      <div class="dw-status-line">
        <div id="dw-dot" class="dw-status-dot"></div>
        <div id="dw-status-text" class="dw-status-text">Очікування...</div>
      </div>
      <div id="dw-update-date" class="dw-schedule-date">...</div>
    </div>

    <div id="dw-grid-root" class="dw-schedule-grid"></div>

  </div>`;

  bindEvents();
}

// ── Event wiring ──────────────────────────────────────────────────────────────
function bindEvents() {
  document.getElementById('dw-refresh-btn') .addEventListener('click', startUpdate);
  document.getElementById('dw-settings-btn').addEventListener('click', openSettings);
  document.getElementById('dw-group-tag')   .addEventListener('click', openSettings);
  document.getElementById('dw-cancel-btn')  .addEventListener('click', closeSettings);

  document.getElementById('dw-save-btn').addEventListener('click', () => {
    state.group     = document.getElementById('dw-group-select').value;
    state.region    = document.getElementById('dw-region-select').value;
    state.useAurora = document.getElementById('dw-chk-aurora').checked;
    state.useBlur   = document.getElementById('dw-chk-blur').checked;
    saveSettings({ group: state.group, region: state.region, useAurora: state.useAurora, useBlur: state.useBlur });
    applyVisuals();
    closeSettings();
    startUpdate();
  });

  // Live preview of visual toggles while settings open
  document.getElementById('dw-chk-aurora').addEventListener('change', e => { state.useAurora = e.target.checked; applyVisuals(); });
  document.getElementById('dw-chk-blur')  .addEventListener('change', e => { state.useBlur   = e.target.checked; applyVisuals(); });

  // Day switch
  document.querySelectorAll('.dw-day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedDay = parseInt(btn.dataset.day);
      document.querySelectorAll('.dw-day-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (state.currentRawData) updateInterface();
    });
  });
}

// ── Settings overlay ──────────────────────────────────────────────────────────
function openSettings() {
  const overlay = document.getElementById('dw-overlay');
  overlay.classList.add('visible');
  document.getElementById('dw-group-select') .value   = state.group  || 'GPV1.1';
  document.getElementById('dw-region-select').value   = state.region;
  document.getElementById('dw-chk-aurora')  .checked = state.useAurora;
  document.getElementById('dw-chk-blur')    .checked = state.useBlur;
  if (state.group || state.region) {
    document.getElementById('dw-cancel-btn').style.display = 'block';
  }
}
function closeSettings() {
  document.getElementById('dw-overlay').classList.remove('visible');
}

// ── Visual effects ────────────────────────────────────────────────────────────
function applyVisuals() {
  const c = document.getElementById('dw-container');
  if (!c) return;
  c.classList.toggle('aurora-on',  state.useAurora);
  c.classList.toggle('aurora-off', !state.useAurora);
  c.classList.toggle('blur-on',    state.useBlur);
  c.classList.toggle('blur-off',   !state.useBlur);
}

// ── Data fetch via proxy ──────────────────────────────────────────────────────
async function startUpdate() {
  if (!state.group || !state.region) { openSettings(); return; }
  if (state.loading) return;
  state.loading = true;

  const btn = document.getElementById('dw-refresh-btn');
  if (btn) btn.classList.add('loading');
  document.getElementById('dw-status-text').innerText = 'Оновлення...';

  try {
    const url = `${PROXY_BASE}/api/dtek?region=${encodeURIComponent(state.region)}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (data.status === 'success') {
      state.currentRawData = data.rawFact;
      updateInterface();
    } else if (data.status === 'cloudflare') {
      setError('☁ Cloudflare захист — спробуйте пізніше');
    } else {
      setError(data.message || 'Невідома помилка');
    }
  } catch (e) {
    setError('⚠ Проксі-сервер недоступний — запустіть node proxy-server.js');
  } finally {
    state.loading = false;
    if (btn) btn.classList.remove('loading');
  }
}

function setError(msg) {
  document.getElementById('dw-status-text').innerText = 'Помилка';
  document.getElementById('dw-grid-root').innerHTML =
    `<div class="dw-error-msg">${msg}</div>`;
}

// ── Render interface — identical logic to desktop updateInterface() ────────────
function updateInterface() {
  const regionShort = REGION_SHORT[state.region] || 'ДТЕК';
  const groupLabel  = state.group.replace('GPV', '');
  const groupTag    = document.getElementById('dw-group-tag');
  if (groupTag) groupTag.innerText = `${regionShort} · ${groupLabel}`;

  const timestamps   = Object.keys(state.currentRawData).sort();
  const todayRaw     = timestamps[0] ? state.currentRawData[timestamps[0]][state.group] : null;
  const tomorrowRaw  = timestamps[1] ? state.currentRawData[timestamps[1]][state.group] : null;

  function convertToGrid(h) {
    const g = {};
    if (!h) return g;
    for (let i = 1; i <= 24; i++) {
      const v = String(h[i] || '').toLowerCase();
      if (v === 'no') g[i-1] = '1';
      else if (v.includes('first') || v.includes('second') || v.includes('maybe')) g[i-1] = '2';
      else g[i-1] = '0';
    }
    return g;
  }

  const todayGrid    = convertToGrid(todayRaw);
  const tomorrowGrid = convertToGrid(tomorrowRaw);
  const ag = state.selectedDay === 0 ? todayGrid : tomorrowGrid;

  const now = new Date(), ch = now.getHours();
  const dd  = new Date();
  if (state.selectedDay === 1) dd.setDate(now.getDate() + 1);
  document.getElementById('dw-update-date').innerText =
    `ГРАФІК НА ${dd.toLocaleDateString('uk-UA')}`;

  // Current status dot & border
  const outNow = Object.keys(todayGrid).length > 0 ? todayGrid[ch] === '1' : false;
  document.getElementById('dw-status-text').innerText = outNow ? 'Світла немає' : 'Світло є';
  const accent = outNow ? '#ff4444' : '#00ff88';
  const dot = document.getElementById('dw-dot');
  if (dot) {
    dot.style.backgroundColor = accent;
    dot.style.boxShadow = `0 0 15px ${accent}, 0 0 5px white`;
  }
  const container = document.getElementById('dw-container');
  if (container) {
    container.style.borderColor = outNow ? 'rgba(255,68,68,0.5)' : 'rgba(0,255,136,0.5)';
  }

  // Tomorrow: check if schedule published
  if (state.selectedDay === 1) {
    const agKeys  = Object.keys(ag);
    const allClear = agKeys.length > 0 && Object.values(ag).every(v => v === '0');
    const noData   = agKeys.length === 0;
    if (allClear || noData) {
      document.getElementById('dw-grid-root').innerHTML = `
        <div class="dw-no-data">
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <rect x="8" y="14" width="74" height="52" rx="4" fill="none" stroke="white" stroke-width="2.5"/>
            <path d="M22 14 L22 8 L30 8" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <path d="M68 14 L68 8 L60 8" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <line x1="45" y1="66" x2="45" y2="80" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="33" y1="80" x2="57" y2="80" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <text x="45" y="50" text-anchor="middle" font-size="28" font-family="Segoe UI,sans-serif" font-weight="700" fill="white" opacity="0.9">?</text>
          </svg>
          <div>Графік ще не опубліковано</div>
        </div>`;
      return;
    }
  }

  // Build 2-column 24-row grid (identical to desktop)
  let l = '', r = '';
  for (let h = 0; h < 24; h++) {
    const s = ag[h] || '0';
    const indicatorCls = 'dw-indicator' + (s === '1' ? ' power-off' : s === '2' ? ' power-half' : '');
    const activeCls    = (state.selectedDay === 0 && h === ch) ? 'active' : '';
    const row = `<div class="dw-schedule-row ${activeCls}">
      <span class="dw-time">${String(h).padStart(2,'0')}-${String(h+1).padStart(2,'0')}</span>
      <div class="${indicatorCls}"></div>
    </div>`;
    if (h < 12) l += row; else r += row;
  }
  document.getElementById('dw-grid-root').innerHTML =
    `<div class="dw-schedule-col">${l}</div><div class="dw-schedule-col">${r}</div>`;
}
