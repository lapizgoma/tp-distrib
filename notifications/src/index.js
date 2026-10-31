import { createApp } from './app.js';
import { loadConfig, validateConfig } from './config.js';
import { createPool } from './db.js';
import { createKafka } from './kafka.js';
import { logger } from './logger.js';
import { createNotificationsRepository } from './notificationsRepository.js';
import { createMessageHandler } from './processor.js';
import { sleepWithHeartbeat } from './wait.js';

let config;
try {
  config = validateConfig(loadConfig());
} catch (err) {
  logger.error(`configuración inválida: ${err.message}`);
  process.exit(1);
}

const pool = createPool(config.db);
const repository = createNotificationsRepository(pool);
const kafka = createKafka({ ...config.kafka, logger });

const handle = createMessageHandler({
  repository,
  sendToDlq: kafka.sendToDlq,
  wait: sleepWithHeartbeat,
  retry: config.retry,
  logger,
});

const app = createApp({
  repository,
  ping: () => pool.query('SELECT 1'),
  jwt: config.jwt,
  logger,
});

let stopping = false;

// El HTTP levanta ANTES de conectar con Kafka: /health responde aunque el broker este caido.
const server = app.listen(config.http.port, () => {
  logger.info(
    `http en http://localhost:${config.http.port}/health y http://localhost:${config.http.port}/api/notifications`,
  );
});
server.on('error', (err) => {
  logger.error(`error del servidor HTTP (puerto ${config.http.port}): ${err.message}`);
  shutdown(1);
});

function closeHttp() {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

async function shutdown(code) {
  if (stopping) return;
  stopping = true;
  logger.info('deteniendo el servicio de notificaciones');
  const forceExit = setTimeout(() => process.exit(code), 8000);
  await Promise.allSettled([closeHttp(), kafka.stop(), pool.end()]);
  clearTimeout(forceExit);
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

try {
  await kafka.start(handle, {
    onFatal: (err) => {
      logger.error(`${err.message}. Se detiene sin confirmar el offset`);
      shutdown(1);
    },
  });
  logger.info(`notificaciones escuchando ${config.kafka.eventsTopic}, grupo ${config.kafka.groupId}`);
} catch (err) {
  logger.error(`no se pudo iniciar el consumidor: ${err.message}`);
  await shutdown(1);
}