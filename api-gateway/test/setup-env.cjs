// Se ejecuta antes de cargar config.js (en ESM los imports se evalúan primero)
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_SECRET_BASE64 = 'false';