import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

// Test de integración: Gateway real + cliente gRPC real + servidor gRPC falso
// que usa el mismo work.proto. No hace falta Docker ni MySQL.

jest.setTimeout(15000);

const PROTO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../protos/work.proto');
const URL = '/api/grpc/works/compare';

const token = (role = 'VISITANTE') =>
  jwt.sign({ sub: 'u7@museo.com', userId: 7, role }, 'test-secret', { algorithm: 'HS256' });
const bearer = (role) => ({ Authorization: `Bearer ${token(role)}` });

const makeWork = (id) => ({
  id,
  title: `Obra ${id}`,
  artist_id: '1',
  artist_name: 'Artista',
  image_url: 'http://img',
  creation_year: 1889,
  technique: 'OLEO',
  dimensions: '10 x 10 cm',
  era: 'IMPRESIONISMO',
  topic: 'Naturaleza,Paisaje',
  description: 'desc',
  location: 'SALA_1',
  availability: 'EN_EXHIBICION',
  estimated_duration_minutes: 15,
});

// Ids "mágicos" para que el servidor falso responda distinto.
const INVALID_ID = '900';
const NOT_FOUND_ID = '404';
const INTERNAL_ID = '500';
const HANG_ID = '777';

let server;
let app;
let config;
let clients;
const received = [];

function handleCompare(call, callback) {
  const ids = call.request.work_ids;
  received.push({ ids, metadata: call.metadata.getMap() });

  if (ids.includes(INVALID_ID)) {
    return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'fake invalid argument' });
  }
  if (ids.includes(NOT_FOUND_ID)) {
    return callback({ code: grpc.status.NOT_FOUND, details: 'fake not found (missing ids: [404])' });
  }
  if (ids.includes(INTERNAL_ID)) {
    return callback({ code: grpc.status.INTERNAL, details: 'detalle interno que no debe filtrarse' });
  }
  if (ids.includes(HANG_ID)) {
    return; // nunca responde: fuerza el deadline
  }
  callback(null, { works: ids.map(makeWork) });
}

beforeAll(async () => {
  // 1. Servidor gRPC falso con el .proto real, en un puerto libre.
  const def = protoLoader.loadSync(PROTO, { keepCase: true, longs: String, defaults: true });
  const { WorkService } = grpc.loadPackageDefinition(def).museum.works;

  server = new grpc.Server();
  server.addService(WorkService.service, { GetWorksForComparison: handleCompare });

  const port = await new Promise((resolve, reject) => {
    server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (err, boundPort) =>
      err ? reject(err) : resolve(boundPort),
    );
  });

  // 2. La Gateway real, apuntando a ese puerto. Import dinámico DESPUÉS de setear el env.
  process.env.GRPC_WORKS_URL = `127.0.0.1:${port}`;
  config = (await import('../src/config.js')).default;
  const grpcModule = await import('../src/grpc/clients.js');
  clients = grpcModule.clients;
  const { createApp } = await import('../src/app.js');
  app = createApp({ clients: grpcModule.clients, call: grpcModule.call });
});

afterAll(() => {
  if (clients) clients.works.close();
  try {
    server.forceShutdown();
  } catch {
    // ya estaba apagado (lo apaga el último test)
  }
});

beforeEach(() => {
  received.length = 0;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Gateway <-> servicio de obras por gRPC real', () => {
  test('200: la respuesta atraviesa el cable con el contrato del .proto', async () => {
    const res = await request(app).post(URL).set(bearer()).send({ work_ids: [4, 1, 6] });

    expect(res.status).toBe(200);
    expect(res.body.works).toHaveLength(3);
    expect(res.body.works.map((w) => w.id)).toEqual(['4', '1', '6']);

    const first = res.body.works[0];
    expect(typeof first.id).toBe('string'); // int64 -> string (longs: String)
    expect(typeof first.artist_id).toBe('string');
    expect(typeof first.creation_year).toBe('number'); // int32 -> number
    expect(typeof first.estimated_duration_minutes).toBe('number');
    expect(first.topic).toBe('Naturaleza,Paisaje'); // un solo string con comas
    expect(first).toEqual(expect.objectContaining({ title: 'Obra 4', technique: 'OLEO', era: 'IMPRESIONISMO' }));
  });

  test('el servicio recibe los ids en el orden pedido', async () => {
    await request(app).post(URL).set(bearer()).send({ work_ids: [9, 2, 5] });

    expect(received).toHaveLength(1);
    expect(received[0].ids).toEqual(['9', '2', '5']);
  });

  test.each(['VISITANTE', 'CURADOR', 'ADMINISTRADOR'])(
    'el servicio recibe x-user-id y x-user-rol por metadata (%s)',
    async (role) => {
      await request(app).post(URL).set(bearer(role)).send({ work_ids: [1, 2] });

      expect(received).toHaveLength(1);
      expect(received[0].metadata['x-user-id']).toBe('7');
      expect(received[0].metadata['x-user-rol']).toBe(role);
    },
  );

  test('sin token no se llama al servicio', async () => {
    const res = await request(app).post(URL).send({ work_ids: [1, 2] });

    expect(res.status).toBe(401);
    expect(received).toHaveLength(0);
  });

  test('INVALID_ARGUMENT del servicio -> 400 con su detalle', async () => {
    const res = await request(app).post(URL).set(bearer()).send({ work_ids: [1, Number(INVALID_ID)] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('fake invalid argument');
  });

  test('NOT_FOUND del servicio -> 404 con su detalle', async () => {
    const res = await request(app).post(URL).set(bearer()).send({ work_ids: [1, Number(NOT_FOUND_ID)] });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('fake not found (missing ids: [404])');
  });

  test('INTERNAL del servicio -> 500 genérico, sin filtrar el detalle', async () => {
    const res = await request(app).post(URL).set(bearer()).send({ work_ids: [1, Number(INTERNAL_ID)] });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
  });

  test('servicio que no responde -> DEADLINE_EXCEEDED -> 504', async () => {
    const original = config.grpc.deadlineMs;
    config.grpc.deadlineMs = 300;
    try {
      const res = await request(app).post(URL).set(bearer()).send({ work_ids: [1, Number(HANG_ID)] });
      expect(res.status).toBe(504);
    } finally {
      config.grpc.deadlineMs = original;
    }
  });

  // apaga el servidor falso
  test('servicio caído -> UNAVAILABLE -> 503', async () => {
    server.forceShutdown();

    const res = await request(app).post(URL).set(bearer()).send({ work_ids: [1, 2] });

    expect(res.status).toBe(503);
    expect(res.body.error).toBeDefined();
  });
});