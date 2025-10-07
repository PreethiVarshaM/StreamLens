require('dotenv').config();
const { Kafka } = require('kafkajs');
const { Client: ESClient } = require('@elastic/elasticsearch');
const Redis = require('ioredis');

const broker = process.env.KAFKA_BROKER || 'kafka:9092';
const topic = process.env.KAFKA_TOPIC || 'logs';
const esUrl = process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200';
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

const kafka = new Kafka({ brokers: [broker] });
const consumer = kafka.consumer({ groupId: 'logs-consumer-group' });

const es = new ESClient({ node: esUrl });
const redis = new Redis(redisUrl);

async function ensureIndex() {
  const idx = 'logs';
  const exists = await es.indices.exists({ index: idx });
  if (!exists.body) {
    await es.indices.create({
      index: idx,
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            timestamp: { type: 'date' },
            service: { type: 'keyword' },
            severity: { type: 'keyword' },
            message: { type: 'text' }
          }
        }
      }
    });
    console.log('Created ES index', idx);
  } else {
    console.log('ES index exists');
  }
}

async function run() {
  await ensureIndex();

  await consumer.connect();
  console.log('Consumer connected to', broker);

  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value.toString();
        const obj = JSON.parse(value);

        // Index in Elasticsearch
        await es.index({
          index: 'logs',
          id: obj.id,
          body: obj,
          refresh: false
        });

        // Push to Redis list for latest logs and trim to keep only last 100
        await redis.lpush('latest_logs', JSON.stringify(obj));
        await redis.ltrim('latest_logs', 0, 99);

        // Increment per-minute counters for error severity
        if (obj.severity === 'ERROR') {
          const minuteKey = `errors:${new Date(obj.timestamp).toISOString().slice(0,16)}`; // YYYY-MM-DDTHH:MM
          await redis.incr(minuteKey);
          // Set expiry for metrics (e.g., 48 hours)
          await redis.expire(minuteKey, 60*60*48);
        }

        console.log('Consumed & stored', obj.id, obj.severity);
      } catch (err) {
        console.error('Processing error', err);
      }
    }
  });
}

run().catch(err => {
  console.error('Consumer crashed', err);
  process.exit(1);
});
