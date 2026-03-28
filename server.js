// server.js
const express = require('express');
const cors = require('cors');
const { NEWS_SOURCES, TECH_SOURCES, CRYPTO_SOURCES, BUSINESS_SOURCES, fetchFeed, dedupe } = require('./lib/aggregator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  next();
});

// Cache setup — per category
let cache = { news: null, tech: null, crypto: null, business: null };
let cacheTimestamps = { news: 0, tech: 0, crypto: 0, business: 0 };
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Helper: apply keyword filter safely
function applyKeywordFilter(items, keyword) {
  if (!keyword) return items;
  const terms = keyword
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0);
  if (terms.length === 0) return items;
  return items.filter(item =>
    terms.some(term =>
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term))
    )
  );
}

// Helper: apply source filter
function applySourceFilter(items, sourcesFilter) {
  if (!sourcesFilter) return items;
  return items.filter(item => sourcesFilter.includes(item.source));
}

// === /api/news endpoint ===
app.get('/api/news', async (req, res) => {
  const { limit = 100, source: sourceParam, q: keyword } = req.query;
  const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 200);
  const sourcesFilter = sourceParam ? sourceParam.split(',').map(s => s.trim()) : null;

  try {
    const now = Date.now();
    // Use cache only if no keyword and not expired
    if (!keyword && cache.news && (now - cacheTimestamps.news) < CACHE_TTL) {
      let results = cache.news;
      results = applySourceFilter(results, sourcesFilter);
      results = applyKeywordFilter(results, keyword);
      return res.json({
        total: results.length,
        items: results.slice(0, limitNum),
        cached: true,
        updated_at: new Date(cacheTimestamps.news).toISOString()
      });
    }

    // Fetch with error resilience
    const results = await Promise.allSettled(NEWS_SOURCES.map(src => fetchFeed(src, 10)));
    const allItems = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    const deduped = dedupe(allItems);
    const news = deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update cache
    cache.news = news;
    cacheTimestamps.news = now;

    let filtered = news;
    filtered = applySourceFilter(filtered, sourcesFilter);
    filtered = applyKeywordFilter(filtered, keyword);

    res.json({
      total: filtered.length,
      items: filtered.slice(0, limitNum),
      cached: false,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('News error:', e);
    res.status(500).json({ error: 'Aggregation failed' });
  }
});

// === /api/tech endpoint ===
app.get('/api/tech', async (req, res) => {
  const { limit = 100, source: sourceParam, q: keyword } = req.query;
  const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 200);
  const sourcesFilter = sourceParam ? sourceParam.split(',').map(s => s.trim()) : null;

  try {
    const now = Date.now();
    if (!keyword && cache.tech && (now - cacheTimestamps.tech) < CACHE_TTL) {
      let results = cache.tech;
      results = applySourceFilter(results, sourcesFilter);
      results = applyKeywordFilter(results, keyword);
      return res.json({
        total: results.length,
        items: results.slice(0, limitNum),
        cached: true,
        updated_at: new Date(cacheTimestamps.tech).toISOString()
      });
    }

    const results = await Promise.allSettled(TECH_SOURCES.map(src => fetchFeed(src, 10)));
    const allItems = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    const deduped = dedupe(allItems);
    const tech = deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

    cache.tech = tech;
    cacheTimestamps.tech = now;

    let filtered = tech;
    filtered = applySourceFilter(filtered, sourcesFilter);
    filtered = applyKeywordFilter(filtered, keyword);

    res.json({
      total: filtered.length,
      items: filtered.slice(0, limitNum),
      cached: false,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Tech error:', e);
    res.status(500).json({ error: 'Aggregation failed' });
  }
});

// === /api/crypto endpoint ===
app.get('/api/crypto', async (req, res) => {
  const { limit = 100, source: sourceParam, q: keyword } = req.query;
  const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 200);
  const sourcesFilter = sourceParam ? sourceParam.split(',').map(s => s.trim()) : null;

  try {
    const now = Date.now();
    if (!keyword && cache.crypto && (now - cacheTimestamps.crypto) < CACHE_TTL) {
      let results = cache.crypto;
      results = applySourceFilter(results, sourcesFilter);
      results = applyKeywordFilter(results, keyword);
      return res.json({
        total: results.length,
        items: results.slice(0, limitNum),
        cached: true,
        updated_at: new Date(cacheTimestamps.crypto).toISOString()
      });
    }

    const results = await Promise.allSettled(CRYPTO_SOURCES.map(src => fetchFeed(src, 10)));
    const allItems = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    const deduped = dedupe(allItems);
    const crypto = deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

    cache.crypto = crypto;
    cacheTimestamps.crypto = now;

    let filtered = crypto;
    filtered = applySourceFilter(filtered, sourcesFilter);
    filtered = applyKeywordFilter(filtered, keyword);

    res.json({
      total: filtered.length,
      items: filtered.slice(0, limitNum),
      cached: false,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Crypto error:', e);
    res.status(500).json({ error: 'Aggregation failed' });
  }
});

// === /api/business endpoint ===
app.get('/api/business', async (req, res) => {
  const { limit = 100, source: sourceParam, q: keyword } = req.query;
  const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 200);
  const sourcesFilter = sourceParam ? sourceParam.split(',').map(s => s.trim()) : null;

  try {
    const now = Date.now();
    if (!keyword && cache.business && (now - cacheTimestamps.business) < CACHE_TTL) {
      let results = cache.business;
      results = applySourceFilter(results, sourcesFilter);
      results = applyKeywordFilter(results, keyword);
      return res.json({
        total: results.length,
        items: results.slice(0, limitNum),
        cached: true,
        updated_at: new Date(cacheTimestamps.business).toISOString()
      });
    }

    const results = await Promise.allSettled(BUSINESS_SOURCES.map(src => fetchFeed(src, 10)));
    const allItems = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    const deduped = dedupe(allItems);
    const business = deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

    cache.business = business;
    cacheTimestamps.business = now;

    let filtered = business;
    filtered = applySourceFilter(filtered, sourcesFilter);
    filtered = applyKeywordFilter(filtered, keyword);

    res.json({
      total: filtered.length,
      items: filtered.slice(0, limitNum),
      cached: false,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Business error:', e);
    res.status(500).json({ error: 'Aggregation failed' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RSS Aggregator API running on port ${PORT}`);
});
