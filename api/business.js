// api/business.js
const { BUSINESS_SOURCES, fetchFeed, dedupe } = require('../lib/aggregator');

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { limit = 200, source: sourceParam } = req.query;
  const limitNum = Math.min(Math.max(parseInt(limit) || 200, 1), 200);
  const sourcesFilter = sourceParam ? sourceParam.split(',').map(s => s.trim()) : null;

  try {
    if (cache && Date.now() - cacheTime < CACHE_TTL) {
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

    const promises = BUSINESS_SOURCES.map(src => fetchFeed(src, 5));
    const allItems = (await Promise.all(promises)).flat();
    const deduped = dedupe(allItems);
    const business = deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update shared cache
    if (global.rssCache) {
      global.rssCache.business = business;
    } else {
      global.rssCache = { news: [], business };
    }
    cacheTime = Date.now();
    cache = { business };

    let filtered = business;
    if (sourcesFilter) {
      filtered = business.filter(item => sourcesFilter.includes(item.source));
    }

    res.json({
      total: filtered.length,
      items: filtered.slice(0, limitNum),
      cached: false,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Aggregation failed' });
  }

}
