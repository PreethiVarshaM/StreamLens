require('dotenv').config();
const express = require('express');
const { Client: ESClient } = require('@elastic/elasticsearch');
const Redis = require('ioredis');

const app = express();
const port = process.env.SERVICE_PORT || 3000;
const es = new ESClient({ node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200' });
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

// Search logs in ES
app.get('/search', async (req, res) => {
  const q = req.query.q || '';
  const size = parseInt(req.query.size || '20', 10);
  try {
    const resp = await es.search({
      index: 'logs',
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ['message', 'service', 'severity']
          }
        },
        sort: [{ timestamp: { order: 'desc' } }],
        size
      }
    });
    const hits = resp.body.hits.hits.map(h => h._source);
    res.json({ total: resp.body.hits.total, hits });
  } catch (err) {
    console.error('ES search error', err);
    res.status(500).json({ error: 'search failed' });
  }
});

// Latest logs from Redis
app.get('/latest', async (req, res) => {
  try {
    const items = await redis.lrange('latest_logs', 0, 49); // latest 50
    const parsed = items.map(i => JSON.parse(i));
    res.json(parsed);
  } catch (err) {
    console.error('Redis error', err);
    res.status(500).json({ error: 'redis failed' });
  }
});

// Error counts for a minute (format: YYYY-MM-DDTHH:MM)
app.get('/errors', async (req, res) => {
  const minute = req.query.minute;
  if (!minute) return res.status(400).json({ error: 'provide minute param like 2023-08-01T15:04' });
  const key = `errors:${minute}`;
  try {
    const count = await redis.get(key);
    res.json({ minute, count: parseInt(count || '0', 10) });
  } catch (err) {
    console.error('Redis error', err);
    res.status(500).json({ error: 'redis failed' });
  }
});

app.listen(port, () => {
  console.log(`API listening on ${port}`);
});
