// api/news.js
const { NEWS_SOURCES, fetchFeed, dedupe } = require('../lib/aggregator');

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { limit = 100, source: sourceParam, q: keyword } = req.query;
  const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 200);
  const sourcesFilter = sourceParam ? sourceParam.split(',').map(s => s.trim()) : null;

  try {
    // Use cache only if no keyword is provided (dynamic results)
    if (!keyword && cache && Date.now() - cacheTime < CACHE_TTL) {
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

    // Fetch fresh data
    const promises = NEWS_SOURCES.map(src => fetchFeed(src, 10));
    const allItems = (await Promise.all(promises)).flat();
    const deduped = dedupe(allItems);
    const news = deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update cache
    cache = { news };
    cacheTime = Date.now();

    // Apply source filter
    let filtered = news;
    if (sourcesFilter) {
      filtered = news.filter(item => sourcesFilter.includes(item.source));
    }

    // ✅ Apply keyword filter (case-insensitive, supports multiple terms)
    if (keyword) {
      const terms = keyword
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

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
    console.error('News aggregation error:', e);
    res.status(500).json({ error: 'Aggregation failed' });
  }
}
