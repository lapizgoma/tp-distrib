const MIN_JWT_SECRET_LENGTH = 32;

// Las variables de entorno siempre llegan como texto: los números hay que convertirlos.
// Si el valor no es un entero >= 0, el servicio no arranca y dice cuál variable está mal.
function integer(env, key, fallback) {
  const value = Number(env[key] || fallback);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `${key} debe ser un entero >= 0 (valor recibido: ${env[key]})`,
    );
  }
  return value;
}

// Sin efectos al importar: los tests pasan su propio env.
export function loadConfig(env = process.env) {
  return {
    db: {
      host: env.DB_HOST || "localhost",
      port: integer(env, "DB_PORT", 3306),
      database: env.DB_NAME || "museo_virtual",
      user: env.DB_USER || "root",
      password: env.DB_PASSWORD || "root",
    },
    kafka: {
      brokers: [env.KAFKA_BOOTSTRAP_SERVERS || "localhost:29092"],
      clientId: "notification-service",
      groupId: env.KAFKA_GROUP_ID || "notification-service",
      eventsTopic: env.KAFKA_TOPIC_EVENTS || "museum.events",
      dlqTopic: env.KAFKA_TOPIC_DLQ || "notification-dlq",
    },
    retry: {
      initialMs: integer(env, "RETRY_INITIAL_MS", 1000),
      maxDelayMs: integer(env, "RETRY_MAX_DELAY_MS", 30000),
      totalMs: integer(env, "RETRY_TOTAL_MS", 600000),
    },
    jwt: {
      secret: env.JWT_SECRET || "",
      issuer: env.JWT_ISSUER || "museo-virtual",
    },
    http: {
      port: integer(env, "PORT", 8084),
    },
  };
}

// Está aparte de loadConfig para que los tests de base de datos, que solo
// necesitan config.db, no dependan de JWT_SECRET.
export function validateConfig(config) {
  if (config.jwt.secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET debe tener al menos ${MIN_JWT_SECRET_LENGTH} caracteres y ser igual al de Spring`,
    );
  }
  const { port } = config.http;
  if (port < 1 || port > 65535) {
    throw new Error(
      `PORT debe estar entre 1 y 65535 (valor recibido: ${port})`,
    );
  }
  return config;
}
