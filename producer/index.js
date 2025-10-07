require('dotenv').config();
const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

const broker = process.env.KAFKA_BROKER || 'kafka:9092';
const topic = process.env.KAFKA_TOPIC || 'logs';

const kafka = new Kafka({ brokers: [broker] });
const producer = kafka.producer();

const severities = ['DEBUG','INFO','WARN','ERROR'];

function randomMessage() {
  const id = uuidv4();
  const severity = severities[Math.floor(Math.random()*severities.length)];
  const ts = new Date().toISOString();
  const msg = {
    id,
    timestamp: ts,
    service: 'orders-service',
    severity,
    message: `${severity} - sample log message ${Math.floor(Math.random()*10000)}`
  };
  return msg;
}

async function run() {
  await producer.connect();
  console.log('Producer connected to', broker);

  // send a message every 200ms (adjust to simulate load)
  setInterval(async () => {
    const log = randomMessage();
    try {
      await producer.send({
        topic,
        messages: [{ key: log.service, value: JSON.stringify(log) }]
      });
      console.log('Produced', log.severity, log.id);
    } catch (err) {
      console.error('Produce error', err);
    }
  }, 200);
}

run().catch(err => {
  console.error('Producer error', err);
  process.exit(1);
});
