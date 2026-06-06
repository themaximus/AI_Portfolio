/**
 * proxy-server.js
 * Tiny Express proxy — fetches DTEK schedule data server-side,
 * bypassing browser CORS restrictions.
 *
 * Run with:  node proxy-server.js
 * Then start Vite normally:  npm run dev
 */

const express = require('express');
const https   = require('https');
const http    = require('http');

const app  = express();
const PORT = 3001;

// Allow requests from the Vite dev server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
});

// ── DTEK data endpoint ────────────────────────────────────────────────────────
// GET /api/dtek?region=https://www.dtek-dnem.com.ua/ua/shutdowns
app.get('/api/dtek', async (req, res) => {
  const regionUrl = req.query.region || 'https://www.dtek-dnem.com.ua/ua/shutdowns';

  // Validate — only allow dtek domains
  if (!/^https:\/\/www\.dtek-[a-z]+\.com\.ua\//.test(regionUrl)) {
    return res.status(400).json({ status: 'error', message: 'Невалідний регіон' });
  }

  fetchUrl(regionUrl, (err, html) => {
    if (err) {
      console.error('[proxy] fetch error:', err.message);
      return res.status(502).json({ status: 'error', message: "Помилка з'єднання з ДТЕК" });
    }

    // Parse DisconSchedule.fact from HTML (same logic as Electron main.js)
    const match = html.match(/DisconSchedule\.fact\s*=\s*(\{.*?\})\s*(?:;|<\/script>)/s);
    if (!match) {
      // Check for Cloudflare
      if (html.includes('cf-turnstile') || html.includes('Just a moment')) {
        return res.json({ status: 'cloudflare', message: 'Захист Cloudflare активовано. Спробуйте пізніше.' });
      }
      return res.json({ status: 'error', message: 'Дані не знайдено на сторінці' });
    }

    try {
      const parsed = JSON.parse(match[1]);
      if (parsed?.data) {
        return res.json({ status: 'success', rawFact: parsed.data });
      }
      return res.json({ status: 'error', message: 'Невалідна структура даних' });
    } catch (e) {
      return res.json({ status: 'error', message: 'Помилка парсингу JSON' });
    }
  });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true }));

// ── HTTP fetch helper ─────────────────────────────────────────────────────────
function fetchUrl(url, cb) {
  const proto = url.startsWith('https') ? https : http;
  const options = {
    headers: {
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
      'Cache-Control':   'no-cache',
    },
  };

  proto.get(url, options, (response) => {
    // Handle redirects
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      return fetchUrl(response.headers.location, cb);
    }

    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => cb(null, data));
  }).on('error', cb);
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ⚡ DTEK Proxy ready  →  http://localhost:${PORT}/api/dtek\n`);
});
