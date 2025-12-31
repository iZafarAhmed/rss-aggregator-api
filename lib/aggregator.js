// lib/aggregator.js
const Parser = require('rss-parser');
const cheerio = require('cheerio');

// ========== SOURCES ==========
const NEWS_SOURCES = [
  { name: "France 24", url: "https://www.france24.com/en/rss", favicon: "https://www.france24.com/favicon.ico" },
  { name: "CBC Canada", url: "https://www.cbc.ca/webfeed/rss/rss-canada", favicon: "https://www.cbc.ca/favicon.ico" },
  { name: "Daily Sabah", url: "https://www.dailysabah.com/rss/world/mid-east", favicon: "https://www.dailysabah.com/favicon.ico" },
  { name: "Anadolu Agency", url: "https://www.aa.com.tr/en/rss/default?cat=guncel", favicon: "https://www.aa.com.tr/favicon.ico" },
  { name: "Haaretz", url: "https://www.haaretz.com/srv/israel-news-rss", favicon: "https://www.haaretz.com/favicon.ico" },
  { name: "The Hindu", url: "https://www.thehindu.com/feeder/default.rss", favicon: "https://www.thehindu.com/favicon.ico" },
  { name: "The Guardian", url: "https://www.theguardian.com/international/rss", favicon: "https://www.theguardian.com/favicon.ico" },
  { name: "The Independent", url: "https://www.independent.co.uk/rss", favicon: "https://www.independent.co.uk/favicon.ico" },
  { name: "The Irish Times", url: "https://www.irishtimes.com/arc/outboundfeeds/feed-irish-news/", favicon: "https://www.irishtimes.com/favicon.ico" },
  { name: "Korea Herald", url: "https://www.koreaherald.com/rss/newsAll", favicon: "https://www.koreaherald.com/favicon.ico" },
  { name: "Moscow Times", url: "https://www.themoscowtimes.com/rss/news", favicon: "https://www.themoscowtimes.com/favicon.ico" },
  { name: "NY Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", favicon: "https://www.nytimes.com/favicon.ico" },
  { name: "Sydney Morning Herald", url: "https://www.smh.com.au/rss/feed.xml", favicon: "https://www.smh.com.au/favicon.ico" },
  { name: "Times of India", url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", favicon: "https://timesofindia.indiatimes.com/favicon.ico" },
  { name: "Toronto Star", url: "https://www.thestar.com/search/?f=rss", favicon: "https://www.thestar.com/favicon.ico" }
];

const TECH_SOURCES = [
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", favicon: "https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient-192x192.png" },
  { name: "Wired", url: "https://www.wired.com/feed/rss", favicon: "https://www.wired.com/favicon.ico" },
  { name: "Mashable", url: "https://in.mashable.com/sleep.xml", favicon: "https://mashable.com/favicon.ico" },
  { name: "CNET", url: "https://www.cnet.com/rss/news/", favicon: "https://www.cnet.com/favicon.ico" },
  { name: "Engadget", url: "https://www.engadget.com/rss.xml", favicon: "https://www.engadget.com/favicon.ico" },
  { name: "VentureBeat", url: "https://feeds.feedburner.com/venturebeat/SZYF", favicon: "https://venturebeat.com/wp-content/uploads/2020/11/cropped-venturebeat-favicon-192x192.png" },
  { name: "Vox Tech", url: "https://www.vox.com/rss/technology/index.xml", favicon: "https://www.vox.com/favicon.ico" },
  { name: "GeekWire", url: "https://www.geekwire.com/feed/", favicon: "https://www.geekwire.com/wp-content/uploads/2019/03/cropped-geekwire-favicon-192x192.png" },
  { name: "Techenger", url: "https://techenger.com/feed/", favicon: "https://techenger.com/favicon.ico" },
  { name: "Ars Technica", url: "http://feeds.arstechnica.com/arstechnica/technology-lab", favicon: "https://cdn.arstechnica.net/wp-content/themes/ars/img/icons/favicon.ico" },
  { name: "Android Police", url: "http://androidpolice.com/feed" },
  { name: "Tech Radar", url: "https://www.techradar.com/feeds.xml" },
  { name: "Silicon Republic", url: "https://www.siliconrepublic.com/feed/" },
  { name: "Digital Trends", url: "https://www.digitaltrends.com/feed/" },
  { name: "Slashgear", url: "https://www.slashgear.com/feed/" },
  { name: "Slashdot", url: "http://rss.slashdot.org/Slashdot/slashdotMain?format=xml" },
  { name: "Bleeping Computer", url: "https://www.bleepingcomputer.com/feed/" },
  { name: "Zdnet", url: "https://www.zdnet.com/news/rss.xml" },
  { name: "ExtremeTech", url: "https://www.extremetech.com/feed" },
  { name: "Tech Dirt", url: "https://feeds.feedburner.com/techdirt/feed" }
];

const CRYPTO_SOURCES = [
   { name: "Bein Crypto", url: "https://beincrypto.com/feed/" },
   { name: "Bitcoin News", url: "https://news.bitcoin.com/feed" },
   { name: "U.Today", url: "https://u.today/rss.php" },
   { name: "Cointelegraph", url: "https://cointelegraph.com/rss" },
   { name: "Bitcoinst", url: "https://bitcoinist.com/feed/" },
   { name: "Blockonomi", url: "https://blockonomi.com/feed/" },
   { name: "Blockworks", url: "https://blockworks.co/feed" },
   { name: "Coindesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss" },
   { name: "Cointelegraph", url: "https://cointelegraph.com/rss" },
   { name: "Cryptobriefing", url: "https://cryptobriefing.com/feed/" },
   { name: "Crypto Reporter", url: "https://www.crypto-reporter.com/feed/" },
   { name: "Cryptonews", url: "https://cryptonews.com/feed/" },
   { name: "Cryptoninjas", url: "https://www.cryptoninjas.net/feed/" },
   { name: "Cryptopotato", url: "https://cryptopotato.com/feed/" },
   { name: "Decrypt", url: "https://decrypt.co/feed" },
   { name: "Ethnews", url: "https://www.ethnews.com/feed/" },
   { name: "NewsBTC", url: "https://www.newsbtc.com/feed/" },
   { name: "The Block", url: "https://www.theblock.co/rss.xml" },
   { name: "The Defiant", url: "https://thedefiant.io/api/feed" },
   { name: "ZyCrypto", url: "https://zycrypto.com/category/news/feed/" }

];

// ========== CLEANING ==========
function cleanText(html) {
  if (!html) return '';
  const $ = cheerio.load(html, { decodeEntities: true });
  let text = $.text()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\[â€¦\]|\[&hellip;\]|\[...\]/gi, '')
    .replace(/\s+The post\s+.*?appeared first on.*$/gi, '');

  // Mojibake fix
  const fixes = {
    'â€œ': '“', 'â€\u009d': '”', 'â€\u201D': '”', 'â€\u2019': '’', 'â€™': '’',
    'â€˜': '‘', 'â€“': '–', 'â€”': '—', 'â€¦': '…', 'â€\u00A0': ' '
  };
  for (const [bad, good] of Object.entries(fixes)) {
    text = text.replace(new RegExp(bad, 'g'), good);
  }
  return text;
}

// ========== PARSER ==========
const parser = new Parser({
  customFields: {
    item: [
      'content:encoded',
      'media:description',
      'dc:date',
      // Map all possible image-related tags
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'media:thumbnail'],
      ['enclosure', 'enclosure'],
      ['image', 'image']
    ]
  }
});

async function fetchFeed(source, limit = 4) {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items || []).slice(0, limit).map(item => {
      // === Extract image ===
      let imageUrl = null;

      // 1. <image> (e.g., AA.com.tr)
      if (item.image) {
        imageUrl = item.image;
      }
      // 2. <enclosure> (e.g., Mashable, CBC)
      else if (item.enclosure?.url && (item.enclosure.type?.startsWith('image/') || item.enclosure.medium === 'image')) {
        imageUrl = item.enclosure.url;
      }
      // 3. <media:content> (e.g., The Hindu, Daily Sabah)
      else if (item.mediaContent) {
        const mediaItems = Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent];
        const imageMedia = mediaItems.find(m =>
          (m.medium === 'image') || (m.type && m.type.startsWith('image/'))
        );
        if (imageMedia?.url) imageUrl = imageMedia.url;
      }
      // 4. Fallback: <img src> in description
      else if (item.content || item['content:encoded'] || item.contentSnippet) {
        const html = item.content || item['content:encoded'] || item.contentSnippet;
        const match = html.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
        if (match) imageUrl = match[1];
      }

      return {
        title: cleanText(item.title),
        description: cleanText(item.content || item['content:encoded'] || item.contentSnippet || ''),
        url: item.link,
        date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        source: source.name,
        favicon: source.favicon,
        image: imageUrl
      };
    });
  } catch (e) {
    console.error(`Failed ${source.name}:`, e.message);
    return [];
  }
}

// ========== DEDUPE ==========
function dedupe(items) {
  const seen = new Set();
  return items.filter(item => {
    try {
      const url = new URL(item.url);
      const key = url.origin + url.pathname;
      return !seen.has(key) && seen.add(key);
    } catch {
      return true; // keep if invalid URL
    }
  });
}

// ========== EXPORTS ==========
module.exports = {
  NEWS_SOURCES,
  TECH_SOURCES,
  CRYPTO_SOURCES,
  fetchFeed,
  dedupe
};
