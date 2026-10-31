import { loadConfig } from './config.js';
import { createPool } from './db.js';
import { createKafka } from './kafka.js';
import { logger } from './logger.js';
import { createNotificationsRepository } from './notificationsRepository.js';
import { createMessageHandler } from './processor.js';
import { sleepWithHeartbeat } from './wait.js';

const config = loadConfig();
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

let stopping = false;

async function shutdown(code) {
  if (stopping) return;
  stopping = true;
  logger.info('deteniendo el servicio de notificaciones');
  const forceExit = setTimeout(() => process.exit(code), 8000);
  await Promise.allSettled([kafka.stop(), pool.end()]);
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