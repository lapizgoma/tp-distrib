import { describe, test, expect } from '@jest/globals';
import { loadConfig, validateConfig } from '../src/config.js';

const SECRET_32 = 'x'.repeat(32);

describe('configuración del servicio de notificaciones', () => {
  test('sin variables de entorno usa el puerto 8084 y el emisor museo-virtual', () => {
    const config = loadConfig({});

    expect(config.http.port).toBe(8084);
    expect(config.jwt.issuer).toBe('museo-virtual');
    expect(config.jwt.secret).toBe('');
  });

  test('PORT, JWT_SECRET y JWT_ISSUER se leen del entorno', () => {
    const config = loadConfig({ PORT: '9000', JWT_SECRET: SECRET_32, JWT_ISSUER: 'otro' });

    expect(config.http.port).toBe(9000);
    expect(config.jwt).toEqual({ secret: SECRET_32, issuer: 'otro' });
  });

  test('un PORT que no es un número se rechaza al leer la configuración', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });

  test('la validación rechaza un JWT_SECRET ausente', () => {
    expect(() => validateConfig(loadConfig({}))).toThrow(/JWT_SECRET/);
  });

  test('la validación rechaza un JWT_SECRET de menos de 32 caracteres', () => {
    expect(() => validateConfig(loadConfig({ JWT_SECRET: 'x'.repeat(31) }))).toThrow(/JWT_SECRET/);
  });

  test('la validación acepta un JWT_SECRET de 32 caracteres', () => {
    const config = loadConfig({ JWT_SECRET: SECRET_32 });

    expect(validateConfig(config)).toBe(config);
  });

  test.each(['0', '70000'])('la validación rechaza el PORT %s', (port) => {
    expect(() => validateConfig(loadConfig({ JWT_SECRET: SECRET_32, PORT: port }))).toThrow(/PORT/);
  });
});