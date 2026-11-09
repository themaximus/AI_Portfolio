/**
 * dtek-app.js — web version of "Світла.Нєт", the DTEK outage schedule widget
 * (github.com/themaximus/DTEK-Wiget, main.js). The same schedule logic and UI as the
 * Windows app; the parts that need the app itself (tray, window pin, address lookup
 * on the DTEK site in an invisible browser, autostart) are left out.
 * Data comes from proxy-server.cjs: /api/regions and /api/schedule.
 */

// Vite's dev server forwards /api to proxy-server.cjs; in production the proxy serves the page itself
const API_URL = '/api/schedule';
const REGIONS_URL = '/api/regions';
const UPDATE_INTERVAL_MS = 300_000;
const DEFAULT_REGION = 'dnem';

// Regions come from the server (dtek-schedules.cjs): [{ id, name: {ua, en}, short: {ua, en}, lookup }]
let REGIONS = [];

async function loadRegions() {
  try {
    const res = await fetch(REGIONS_URL);
    if (res.ok) REGIONS = await res.json();
  } catch { /* the schedule request reports the server as unavailable */ }
}

function regionById(id) { return REGIONS.find(r => r.id === id) || null; }

function regionText(id, kind) {
  const region = regionById(id);
  const lang = document.documentElement.lang || 'ua';
  return region ? region[kind][lang] || region[kind].ua : id;
}

// Settings saved by the old demo stored the DTEK page URL as the region
function migrateRegion(saved) {
  const dtek = /^https:\/\/www\.dtek-([a-z]+)\.com\.ua\//.exec(saved || '');
  return dtek ? dtek[1] : saved;
}

// Used until a region's schedule has been loaded; Kyiv city, for one, has groups GPV1.1 ... GPV60.1
const QUEUES = [
  'GPV1.1','GPV1.2','GPV2.1','GPV2.2','GPV3.1','GPV3.2',
  'GPV4.1','GPV4.2','GPV5.1','GPV5.2','GPV6.1','GPV6.2',
];

// region -> groups found in its schedule; at most one entry per region
const groupsByRegion = {};

function rememberGroups(region, rawFact) {
  const firstDay = rawFact && Object.values(rawFact)[0];
  if (!firstDay) return;
  const groups = Object.keys(firstDay).filter(g => g.startsWith('GPV'));
  if (groups.length) groupsByRegion[region] = groups.sort((a, b) => parseFloat(a.slice(3)) - parseFloat(b.slice(3)));
}

function groupOptions(region, selected) {
  const groups = groupsByRegion[region] || QUEUES;
  // Keep the saved group of the saved region selectable while that region's list is not loaded yet
  const keepSaved = selected && !groups.includes(selected) && region === state.region && selected === state.group;
  const list = keepSaved ? [selected, ...groups] : groups;
  return list.map(q =>
    `<option value="${q}" ${q === selected ? 'selected' : ''}>${q.replace('GPV', t('queueLabel'))}</option>`
  ).join('');
}

// Settings overlay: show the groups of the region picked there, loading them on demand
async function refreshGroupSelect(region) {
  const select = document.getElementById('dw-group-select');
  if (!select) return;
  const selected = select.value;
  select.innerHTML = groupOptions(region, selected);
  if (groupsByRegion[region]) return;

  try {
    const res  = await fetch(`${API_URL}?region=${encodeURIComponent(region)}`);
    const data = await res.json();
    if (data.status === 'success') rememberGroups(region, data.rawFact);
  } catch { return; }

  // The overlay may have been re-rendered or switched to another region meanwhile
  const current = document.getElementById('dw-group-select');
  if (current && groupsByRegion[region] && document.getElementById('dw-region-select').value === region) {
    const keep = current.value;
    current.innerHTML = groupOptions(region, groupsByRegion[region].includes(keep) ? keep : groupsByRegion[region][0]);
  }
}

const TRANSLATIONS = {
  ua: {
    regionCity: 'Регіон / Місто',
    outageQueue: 'Черга відключень',
    queueLabel: 'Черга ',
    save: 'ЗБЕРЕГТИ',
    cancel: 'СКАСУВАТИ',
    appearance: 'Вигляд',
    performanceImpact: 'Підвищить навантаження на систему',
    blurToggle: 'Прозорість / розмиття',
    author: 'Автор: Максим',
    title: 'Графік',
    refresh: 'Оновити',
    settings: 'Налаштування',
    today: 'Сьогодні',
    tomorrow: 'Завтра',
    waiting: 'Очікування...',
    updating: 'Оновлення...',
    error: 'Помилка',
    noLight: 'Світла немає',
    hasLight: 'Світло є',
    scheduleFor: 'ГРАФІК НА',
    updatedAt: 'оновлено',
    notPublished: 'Графік ще не опубліковано',
    notPublishedToday: 'Відключень немає або графік ще не опубліковано',
    emergency: 'Екстрені відключення',
    emergencyText: 'За наказом НЕК Укренерго застосовані екстрені відключення. Графіки відключень при цьому не діють.',
    emergencyNote: 'Графік повернеться, щойно ДТЕК його відновить.',
    botProtection: 'Сайт ДТЕК увімкнув захист від ботів — спробуйте пізніше',
    proxyUnavailable: 'Сервер віджета недоступний — запустіть node proxy-server.cjs',
  },
  en: {
    regionCity: 'Region / City',
    outageQueue: 'Outage Group',
    queueLabel: 'Group ',
    save: 'SAVE',
    cancel: 'CANCEL',
    appearance: 'Appearance',
    performanceImpact: 'Increases system load',
    blurToggle: 'Transparency / Blur',
    author: 'Author: Maksym',
    title: 'Schedule',
    refresh: 'Refresh',
    settings: 'Settings',
    today: 'Today',
    tomorrow: 'Tomorrow',
    waiting: 'Waiting...',
    updating: 'Updating...',
    error: 'Error',
    noLight: 'Power Off',
    hasLight: 'Power On',
    scheduleFor: 'SCHEDULE FOR',
    updatedAt: 'updated',
    notPublished: 'Schedule not published yet',
    notPublishedToday: 'No outages, or the schedule is not published yet',
    emergency: 'Emergency outages',
    emergencyText: 'Ukrenergo ordered emergency outages. Outage schedules do not apply.',
    emergencyNote: 'The schedule returns as soon as DTEK restores it.',
    botProtection: 'DTEK site bot protection is active — try again later',
    proxyUnavailable: 'Widget server offline — run node proxy-server.cjs',
  }
};

function t(key) {
  const lang = document.documentElement.lang || 'ua';
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS['ua'][key] || key;
}

// ── Persistent settings via localStorage ────────────────────────────────────
function loadSettings() {
  try { return JSON.parse(localStorage.getItem('dtek-settings') || '{}'); } catch { return {}; }
}
function saveSettings(patch) {
  const s = Object.assign(loadSettings(), patch);
  try { localStorage.setItem('dtek-settings', JSON.stringify(s)); } catch { /* private mode */ }
  return s;
}

// ── State ────────────────────────────────────────────────────────────────────
let state = {
  group:     null,
  region:    DEFAULT_REGION,
  useBlur:   false,
  selectedDay: 0,
  currentRawData: null,
  todayKey: null,
  updatedAt: null, // DTEK's own 'last update' text, e.g. '17.10.2026 16:27'
  emergency: { today: false, tomorrow: false, message: null }, // emergency outages: no schedule applies
  loading: false,
};

let updateTimer = null;
let hourTimer = null;
let pendingRequest = null; // AbortController of the running fetch
let pendingRegion  = null;

// ── Entry point ───────────────────────────────────────────────────────────────
export async function initDtekApp() {
  const root = document.getElementById('dtek-app-root');
  if (!root) return;

  await loadRegions();
  restoreSavedSettings();

  renderShell(root);
  applyVisuals();

  if (!state.group) {
    openSettings();
  } else {
    startUpdate();
  }

  scheduleUpdates();

  // Do not poll the sources while the page is hidden; catch up as soon as it is shown again
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(updateTimer);
      clearTimeout(hourTimer);
    } else {
      startUpdate();
      scheduleUpdates();
    }
  });

  window.addEventListener('lang-changed', () => {
    const rootEl = document.getElementById('dtek-app-root');
    if (rootEl && rootEl.querySelector('.dw-container')) {
      const overlayWasVisible = document.getElementById('dw-overlay')?.classList.contains('visible');
      renderShell(rootEl);
      applyVisuals();
      if (overlayWasVisible) openSettings();
      if (state.currentRawData) updateInterface();
      else if (state.group && state.region) startUpdate();
    }
  });
}

function restoreSavedSettings() {
  const saved = loadSettings();
  state.group   = saved.group || null;
  state.region  = migrateRegion(saved.region) || DEFAULT_REGION;
  if (REGIONS.length && !regionById(state.region)) state.region = DEFAULT_REGION;
  state.useBlur = saved.useBlur || false;
}

function scheduleUpdates() {
  clearInterval(updateTimer);
  updateTimer = setInterval(startUpdate, UPDATE_INTERVAL_MS);

  // Refresh exactly on the hour so the "now" row and the power status do not lag behind
  clearTimeout(hourTimer);
  const now = new Date();
  const msToNextHour = (60 - now.getMinutes()) * 60_000 - now.getSeconds() * 1000 - now.getMilliseconds();
  hourTimer = setTimeout(() => { startUpdate(); scheduleUpdates(); }, msToNextHour + 1000);
}

// ── Render the widget shell (same markup as the desktop widget) ───────────────
function renderShell(root) {
  const currentLang = document.documentElement.lang || 'ua';
  root.innerHTML = `
  <div class="dw-container" id="dw-container">
    <!-- Settings Overlay -->
    <div id="dw-overlay" class="dw-overlay">
      <div class="dw-overlay-title">${t('regionCity')}</div>
      <select id="dw-region-select" class="dw-form-select">
        ${REGIONS.map(r =>
          `<option value="${r.id}" ${r.id === state.region ? 'selected' : ''}>${r.name[currentLang] || r.name.ua}</option>`
        ).join('')}
      </select>

      <div class="dw-overlay-title">${t('outageQueue')}</div>
      <select id="dw-group-select" class="dw-form-select">
        ${groupOptions(state.region, state.group)}
      </select>

      <button id="dw-save-btn" class="dw-btn-big dw-btn-save">${t('save')}</button>
      <button id="dw-cancel-btn" class="dw-btn-big dw-btn-cancel" style="display:none">${t('cancel')}</button>

      <hr class="dw-divider">

      <div class="dw-overlay-title">${t('appearance')}</div>

      <label class="dw-toggle-row">
        <div class="dw-toggle-label">
          ${t('blurToggle')}
          <small>${t('performanceImpact')}</small>
        </div>
        <div class="dw-toggle-switch">
          <input type="checkbox" id="dw-chk-blur" ${state.useBlur ? 'checked' : ''}>
          <div class="dw-toggle-track"></div>
          <div class="dw-toggle-thumb"></div>
        </div>
      </label>

      <div class="dw-author-info">
        ${t('author')} | <a href="https://t.me/etojemaximus" target="_blank" class="dw-author-link">@etojemaximus</a>
      </div>
    </div>

    <!-- Widget Body -->
    <div class="dw-header">
      <h2 class="dw-title">${t('title')}</h2>
      <div class="dw-header-actions">
        <div id="dw-refresh-btn" class="dw-icon-btn dw-refresh-btn" title="${t('refresh')}">↻</div>
        <div id="dw-settings-btn" class="dw-icon-btn" title="${t('settings')}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
        <div id="dw-group-tag" class="dw-group-badge">...</div>
      </div>
    </div>

    <div class="dw-day-toggle">
      <button class="dw-day-btn ${state.selectedDay === 0 ? 'active' : ''}" data-day="0">${t('today')}</button>
      <button class="dw-day-btn ${state.selectedDay === 1 ? 'active' : ''}" data-day="1">${t('tomorrow')}</button>
    </div>

    <div class="dw-status-section">
      <div class="dw-status-line">
        <div id="dw-dot" class="dw-status-dot"></div>
        <div id="dw-status-text" class="dw-status-text">${t('waiting')}</div>
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
  document.getElementById('dw-cancel-btn')  .addEventListener('click', cancelSettings);

  document.getElementById('dw-save-btn').addEventListener('click', () => {
    const region = document.getElementById('dw-region-select').value;
    if (region !== state.region) state.currentRawData = null; // never show one region's data under another's name
    state.group   = document.getElementById('dw-group-select').value;
    state.region  = region;
    state.useBlur = document.getElementById('dw-chk-blur').checked;
    saveSettings({ group: state.group, region: state.region, useBlur: state.useBlur });
    applyVisuals();
    closeSettings();
    startUpdate();
  });

  document.getElementById('dw-region-select').addEventListener('change', e => refreshGroupSelect(e.target.value));

  // Live preview of the appearance toggle while settings are open
  document.getElementById('dw-chk-blur').addEventListener('change', e => { state.useBlur = e.target.checked; applyVisuals(); });

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
  if (!overlay) return;
  overlay.classList.add('visible');
  document.getElementById('dw-region-select').value = state.region;
  document.getElementById('dw-group-select').innerHTML = groupOptions(state.region, state.group || 'GPV1.1');
  refreshGroupSelect(state.region);
  document.getElementById('dw-chk-blur').checked = state.useBlur;
  // Nothing to go back to until a group has been saved once
  document.getElementById('dw-cancel-btn').style.display = state.group ? 'block' : 'none';
}

function closeSettings() {
  const overlay = document.getElementById('dw-overlay');
  if (overlay) overlay.classList.remove('visible');
}

// The appearance toggle previews live, so undo the preview when the changes are not saved
function cancelSettings() {
  restoreSavedSettings();
  applyVisuals();
  closeSettings();
}

function applyVisuals() {
  const c = document.getElementById('dw-container');
  if (!c) return;
  c.classList.toggle('blur-on',  state.useBlur);
  c.classList.toggle('blur-off', !state.useBlur);
}

// ── Data fetch ────────────────────────────────────────────────────────────────
async function startUpdate() {
  // Timers fire while the settings are still being filled in; they must not reopen the overlay
  if (!state.group || !state.region) return;
  // A request for the same region is already running; one for an old region is dropped
  if (state.loading && pendingRegion === state.region) return;
  if (pendingRequest) pendingRequest.abort();

  const controller = new AbortController();
  pendingRequest = controller;
  pendingRegion  = state.region;
  state.loading  = true;

  setRefreshSpinner(true);
  const statusEl = document.getElementById('dw-status-text');
  if (statusEl) statusEl.innerText = t('updating');

  try {
    const url  = `${API_URL}?region=${encodeURIComponent(state.region)}`;
    const res  = await fetch(url, { signal: controller.signal });
    const data = await res.json();

    if (data.status === 'success') {
      state.currentRawData = data.rawFact;
      state.todayKey       = data.today != null ? String(data.today) : null;
      state.updatedAt      = data.update || null;
      state.emergency      = data.emergency || { today: false, tomorrow: false, message: null };
      rememberGroups(state.region, data.rawFact);
      updateInterface();
    } else if (data.status === 'protected') {
      setError(t('botProtection'));
    } else {
      setError(data.message || t('error'));
    }
  } catch (e) {
    if (e.name !== 'AbortError') setError(t('proxyUnavailable'));
  } finally {
    // A newer request may have taken over while this one was being aborted
    if (pendingRequest === controller) {
      pendingRequest = null;
      pendingRegion  = null;
      state.loading  = false;
      setRefreshSpinner(false);
    }
  }
}

// Looked up on every call: a language switch re-renders the shell and replaces the button
function setRefreshSpinner(on) {
  const btn = document.getElementById('dw-refresh-btn');
  if (btn) btn.classList.toggle('loading', on);
}

// Keys of today and tomorrow in the loaded schedule (null where that day is not there)
function scheduleDays() {
  const raw = state.currentRawData || {};
  const days = Object.keys(raw).sort((a, b) => Number(a) - Number(b));
  const today = state.todayKey && raw[state.todayKey] ? state.todayKey : null;
  const tomorrow = days.find(day => Number(day) > Number(state.todayKey || 0)) || null;
  return [today, tomorrow];
}

function setError(msg) {
  // Do not let a language switch bring back a schedule that failed to refresh
  state.currentRawData = null;
  const statusEl = document.getElementById('dw-status-text');
  if (statusEl) statusEl.innerText = t('error');
  const gridRoot = document.getElementById('dw-grid-root');
  if (gridRoot) {
    const box = document.createElement('div');
    box.className = 'dw-error-msg';
    box.textContent = msg;
    gridRoot.replaceChildren(box);
  }
}

// ── Render the schedule — the same logic as the desktop updateInterface() ─────
function updateInterface() {
  const currentLang = document.documentElement.lang || 'ua';
  const groupLabel  = state.group.replace('GPV', '');
  const groupTag    = document.getElementById('dw-group-tag');
  if (groupTag) groupTag.innerText = `${regionText(state.region, 'short')} · ${groupLabel}`;

  if (!state.currentRawData) return;
  // The server keeps only today and tomorrow (Kyiv time); a day a source has not published is missing
  const [todayKey, tomorrowKey] = scheduleDays();
  const todayRaw    = todayKey    ? state.currentRawData[todayKey][state.group]    : null;
  const tomorrowRaw = tomorrowKey ? state.currentRawData[tomorrowKey][state.group] : null;

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
  const dateEl = document.getElementById('dw-update-date');
  if (dateEl) {
    // Only the time when it is today's: the date is already in the line ('17.10.2026 16:27' -> '16:27')
    const today = now.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const stamp = state.updatedAt && state.updatedAt.trim();
    const updated = stamp ? ` · ${t('updatedAt')} ${stamp.startsWith(today) ? stamp.split(/\s+/).pop() : stamp}` : '';
    dateEl.innerText = `${t('scheduleFor')} ${dd.toLocaleDateString(currentLang === 'ua' ? 'uk-UA' : 'en-US')}${updated}`;
  }

  // During emergency outages there is no schedule to go by
  const noScheduleToday = !todayRaw;
  const emergencyNow = state.emergency.today;
  const outNow = !emergencyNow && todayGrid[ch] === '1';
  const statusEl = document.getElementById('dw-status-text');
  if (statusEl) statusEl.innerText = emergencyNow ? t('emergency') : outNow ? t('noLight') : t('hasLight');
  const accent = emergencyNow ? '#ff9f1a' : outNow ? '#ff4444' : '#00ff88';
  const dot = document.getElementById('dw-dot');
  if (dot) {
    dot.style.backgroundColor = accent;
    dot.style.boxShadow = `0 0 15px ${accent}, 0 0 5px white`;
  }
  const container = document.getElementById('dw-container');
  if (container) {
    container.style.borderColor = emergencyNow ? 'rgba(255,159,26,0.6)' : outNow ? 'rgba(255,68,68,0.5)' : 'rgba(0,255,136,0.5)';
  }

  const gridRoot = document.getElementById('dw-grid-root');
  if (!gridRoot) return;

  // The day of emergency outages: DTEK's own words instead of the hours
  if (state.selectedDay === 1 ? state.emergency.tomorrow : state.emergency.today) {
    const box = document.createElement('div');
    box.className = 'dw-emergency';
    const title = Object.assign(document.createElement('div'), { className: 'dw-emergency-title', textContent: t('emergency') });
    const text  = Object.assign(document.createElement('div'), { textContent: state.emergency.message || t('emergencyText') });
    const note  = Object.assign(document.createElement('div'), { className: 'dw-emergency-note', textContent: t('emergencyNote') });
    box.append(title, text, note);
    gridRoot.replaceChildren(box);
    return;
  }

  // Tomorrow without outages is not published yet; today without a schedule has none at all
  const agKeys   = Object.keys(ag);
  const allClear = agKeys.length > 0 && Object.values(ag).every(v => v === '0');
  const noData   = agKeys.length === 0;
  if (state.selectedDay === 1 ? allClear || noData : noScheduleToday) {
    gridRoot.innerHTML = `
      <div class="dw-no-data">
        <!-- An outage schedule table, crossed out corner to corner -->
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none" stroke="white"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="8" y="12" width="74" height="64" rx="6"/>
          <line x1="8" y1="26" x2="82" y2="26"/>
          <g stroke-width="1.5" opacity="0.55">
            <line x1="30" y1="26" x2="30" y2="76"/>
            <line x1="8" y1="42.7" x2="82" y2="42.7"/>
            <line x1="8" y1="59.3" x2="82" y2="59.3"/>
          </g>
          <g stroke-width="2" opacity="0.75">
            <line x1="14" y1="34.5" x2="24" y2="34.5"/>
            <line x1="14" y1="51" x2="24" y2="51"/>
            <line x1="14" y1="67.5" x2="24" y2="67.5"/>
          </g>
          <g stroke-width="1.5" fill="white" fill-opacity="0.25">
            <rect x="36" y="30" width="18" height="9" rx="2"/>
            <rect x="58" y="47" width="18" height="8" rx="2"/>
            <rect x="40" y="63" width="26" height="9" rx="2"/>
          </g>
          <line x1="10" y1="14" x2="80" y2="74" stroke-width="3"/>
        </svg>
        <div>${state.selectedDay === 1 ? t('notPublished') : t('notPublishedToday')}</div>
      </div>`;
    return;
  }

  // 2 columns × 12 rows, as on the desktop
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
  gridRoot.innerHTML = `<div class="dw-schedule-col">${l}</div><div class="dw-schedule-col">${r}</div>`;
}
