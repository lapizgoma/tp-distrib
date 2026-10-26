import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import grpc from "@grpc/grpc-js";
import { createApp } from "../src/app.js";

const worksClient = {};
const eventsClient = {};
const call = jest.fn();
const app = createApp({ clients: { works: worksClient, events: eventsClient }, call });

const URL = (era) => `/api/grpc/exploration/era/${era}`;

const token = (role = "VISITANTE") =>
  jwt.sign({ sub: 'u7@museo.com', userId: 7, role }, "test-secret", { algorithm: "HS256" });
const bearer = (role) => ({ Authorization: `Bearer ${token(role)}` });
const grpcError = (code, details) =>
  Object.assign(new Error(details), { code, details });

beforeEach(() => {
  call.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("autenticación y autorización para exploración por era", () => {
  test("sin token -> 401", async () => {
    const res = await request(app).get(URL("IMPRESIONISMO"));
    expect(res.status).toBe(401);
  });

  test("token inválido -> 401", async () => {
    const res = await request(app)
      .get(URL("IMPRESIONISMO"))
      .set("Authorization", "Bearer basura");
    expect(res.status).toBe(401);
  });

  test("rol inexistente -> 403", async () => {
    const res = await request(app)
      .get(URL("IMPRESIONISMO"))
      .set(bearer("INTRUSO"));
    expect(res.status).toBe(403);
  });
});

describe("validación de parámetros de entrada", () => {
  test("era con solo espacios -> 400", async () => {
    const res = await request(app)
      .get(URL("%20%20"))
      .set(bearer());
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("El parámetro era es requerido");
    expect(call).not.toHaveBeenCalled();
  });
});

describe("éxito y orquestación gRPC", () => {
  test.each(["VISITANTE", "CURADOR", "ADMINISTRADOR"])(
    "200 con rol %s orquestando respuestas paralelas de works y events",
    async (role) => {
      const mockWorksResponse = {
        works: [{ id: "1", title: "Impression, Sunrise", era: "IMPRESIONISMO" }],
        artists: ["Claude Monet"],
      };
      const mockEventsResponse = {
        events: [{ id: "10", title: "Taller Impresionista", type: "TALLER" }],
      };

      // Mockeamos las llamadas concurrentes de Promise.all
      call
        .mockResolvedValueOnce(mockWorksResponse)
        .mockResolvedValueOnce(mockEventsResponse);

      const res = await request(app)
        .get(URL("IMPRESIONISMO"))
        .set(bearer(role));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        era: "IMPRESIONISMO",
        works: mockWorksResponse.works,
        artists: mockWorksResponse.artists,
        events: mockEventsResponse.events,
      });

      // Verificamos las llamadas a ambos microservicios gRPC
      expect(call).toHaveBeenNthCalledWith(
        1,
        worksClient,
        "GetWorksAndArtistsByEra",
        { era: "IMPRESIONISMO" },
        { id: "7", rol: role }
      );
      expect(call).toHaveBeenNthCalledWith(
        2,
        eventsClient,
        "GetEventsByEra",
        { era: "IMPRESIONISMO" },
        { id: "7", rol: role }
      );
    }
  );
});

describe("traducción de errores gRPC", () => {
  test.each([
    ["INVALID_ARGUMENT", 400, grpc.status.INVALID_ARGUMENT],
    ["NOT_FOUND", 404, grpc.status.NOT_FOUND],
    ["UNAVAILABLE", 503, grpc.status.UNAVAILABLE],
    ["DEADLINE_EXCEEDED", 504, grpc.status.DEADLINE_EXCEEDED],
    ["INTERNAL (resto)", 500, grpc.status.INTERNAL],
  ])("%s -> HTTP %i", async (_, http, code) => {
    call.mockRejectedValue(grpcError(code, "Error en servicio de exploración"));

    const res = await request(app)
      .get(URL("BARROCO"))
      .set(bearer());

    expect(res.status).toBe(http);
    expect(res.body.error).toBeDefined();
  });
});