import { Kafka, Partitioners, logLevel } from 'kafkajs';

// Unico archivo que conoce kafkajs. Si hay que cambiar de libreria, se
// reemplaza este archivo y el resto no se entera.
export function createKafka({ brokers, clientId, groupId, eventsTopic, dlqTopic, logger }) {
  const kafka = new Kafka({ clientId, brokers, logLevel: logLevel.WARN });
  const consumer = kafka.consumer({ groupId, allowAutoTopicCreation: false });
  const producer = kafka.producer({
    allowAutoTopicCreation: false,
    createPartitioner: Partitioners.DefaultPartitioner,
  });

  consumer.on(consumer.events.CRASH, ({ payload }) => {
    logger.error(`el consumer de kafkajs se cayo: ${payload.error?.message} (reinicia: ${payload.restart})`);
  });

  async function sendToDlq({ key, value, headers }) {
    await producer.send({
      topic: dlqTopic,
      acks: -1, // acks=all
      timeout: 5000,
      messages: [{ key, value, headers }],
    });
  }

  // handle({ message, heartbeat, commit }) lo implementa processor.js.
  async function start(handle, { onFatal }) {
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: eventsTopic, fromBeginning: true });

    await consumer.run({
      autoCommit: false, // el offset se confirma a mano, despues de persistir
      partitionsConsumedConcurrently: 1,
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        try {
          await handle({
            message: {
              topic,
              partition,
              offset: message.offset,
              key: message.key,
              value: message.value,
            },
            heartbeat,
            // Confirmar offset N significa "ya procesé hasta N": se manda N + 1.
            commit: () =>
              consumer.commitOffsets([
                { topic, partition, offset: (BigInt(message.offset) + 1n).toString() },
              ]),
          });
        } catch (err) {
          if (err?.name === 'FatalConsumerError') onFatal(err);
          throw err; // sin commit: Kafka reentrega el mensaje al reiniciar
        }
      },
    });
  }

  async function stop() {
    await Promise.allSettled([consumer.disconnect(), producer.disconnect()]);
  }

  return { start, stop, sendToDlq };
}