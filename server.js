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

// Cache setup
let cache = { news: null, tech: null, crypto: null, business: null };
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// === /api/news endpoint ===
app.get('/api/news', async (req, res) => {
  const { limit = 100, source: sourceParam, q: keyword } = req.query;
  const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 200);
  const sourcesFilter = sourceParam ? sourceParam.split(',').map(s => s.trim()) : null;

  try {
    // Use cache if valid and no keyword
    if (!keyword && cache.news && Date.now() - cacheTime < CACHE_TTL) {
      let results = cache.news;
      if (sourcesFilter) {
        results = results.filter(item => sourcesFilter.includes(item.source));
      }
      return res.json({
        total: results.length,
        items: results.slice(0, limitNum),
        cached: true,
        updated_at: new Date(cacheTime).toISOString()
      });
    }

    // Fetch fresh
    const promises = NEWS_SOURCES.map(src => fetchFeed(src, 10));
    const allItems = (await Promise.all(promises)).flat();
    const deduped = dedupe(allItems);
    const news = deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

    cache.news = news;
    cacheTime = Date.now();

    let filtered = news;
    if (sourcesFilter) {
      filtered = news.filter(item => sourcesFilter.includes(item.source));
    }

    if (keyword) {
      const terms = keyword.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
      if (terms.length > 0) {
        filtered = filtered.filter(item =>
          terms.some(term =>
            (item.title && item.title.toLowerCase().includes(term)) ||
            (item.description && item.description.toLowerCase().includes(term))
          )
        );
      }
    }

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
    if (!keyword && cache.tech && Date.now() - cacheTime < CACHE_TTL) {
      let results = cache.tech;
      if (sourcesFilter) {
        results = results.filter(item => sourcesFilter.includes(item.source));
      }
      return res.json({
        total: results.length,
        items: results.slice(0, limitNum),
        cached: true,
        updated_at: new Date(cacheTime).toISOString()
      });
    }

    const promises = TECH_SOURCES.map(src => fetchFeed(src, 10));
    const allItems = (await Promise.all(promises)).flat();
    const deduped = dedupe(allItems);
    const tech = deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

    cache.tech = tech;
    cacheTime = Date.now();

    let filtered = tech;
    if (sourcesFilter) {
      filtered = tech.filter(item => sourcesFilter.includes(item.source));
    }

    if (keyword) {
      const terms = keyword.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
      if (terms.length > 0) {
        filtered = filtered.filter(item =>
          terms.some(term =>
            (item.title && item.title.toLowerCase().includes(term)) ||
            (item.description && item.description.toLowerCase().includes(term))
          )
        );
      }
    }

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
    if (!keyword && cache.crypto && Date.now() - cacheTime < CACHE_TTL) {
      let results = cache.crypto;
      if (sourcesFilter) {
        results = results.filter(item => sourcesFilter.includes(item.source));
      }
      return res.json({
        total: results.length,
        items: results.slice(0, limitNum),
        cached: true,
        updated_at: new Date(cacheTime).toISOString()
      });
    }

    const promises = CRYPTO_SOURCES.map(src => fetchFeed(src, 10));
    const allItems = (await Promise.all(promises)).flat();
    const deduped = dedupe(allItems);
    const crypto = deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

    cache.crypto = crypto;
    cacheTime = Date.now();

    let filtered = crypto;
    if (sourcesFilter) {
      filtered = crypto.filter(item => sourcesFilter.includes(item.source));
    }

    if (keyword) {
      const terms = keyword.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
      if (terms.length > 0) {
        filtered = filtered.filter(item =>
          terms.some(term =>
            (item.title && item.title.toLowerCase().includes(term)) ||
            (item.description && item.description.toLowerCase().includes(term))
          )
        );
      }
    }

    res.json({
      total: filtered.length,
      items: filtered.slice(0, limitNum),
      cached: false,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('crypto error:', e);
    res.status(500).json({ error: 'Aggregation failed' });
  }
});

// === /api/business endpoint ===
app.get('/api/business', async (req, res) => {
  const { limit = 100, source: sourceParam, q: keyword } = req.query;
  const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 200);
  const sourcesFilter = sourceParam ? sourceParam.split(',').map(s => s.trim()) : null;

  try {
    if (!keyword && cache.business && Date.now() - cacheTime < CACHE_TTL) {
      let results = cache.business;
      if (sourcesFilter) {
        results = results.filter(item => sourcesFilter.includes(item.source));
      }
      return res.json({
        total: results.length,
        items: results.slice(0, limitNum),
        cached: true,
        updated_at: new Date(cacheTime).toISOString()
      });
    }

    const promises = BUSINESS_SOURCES.map(src => fetchFeed(src, 10));
    const allItems = (await Promise.all(promises)).flat();
    const deduped = dedupe(allItems);
    const business = deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

    cache.business = business;
    cacheTime = Date.now();

    let filtered = business;
    if (sourcesFilter) {
      filtered = business.filter(item => sourcesFilter.includes(item.source));
    }

    if (keyword) {
      const terms = keyword.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
      if (terms.length > 0) {
        filtered = filtered.filter(item =>
          terms.some(term =>
            (item.title && item.title.toLowerCase().includes(term)) ||
            (item.description && item.description.toLowerCase().includes(term))
          )
        );
      }
    }

    res.json({
      total: filtered.length,
      items: filtered.slice(0, limitNum),
      cached: false,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('business error:', e);
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
