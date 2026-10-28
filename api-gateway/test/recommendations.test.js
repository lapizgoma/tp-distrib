import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import grpc from "@grpc/grpc-js";
import { createApp } from "../src/app.js";

const worksClient = {};
const call = jest.fn();
const app = createApp({ clients: { works: worksClient }, call });

const URL = "/api/grpc/works/recommended";

const token = (role = "VISITANTE", userId = 7) =>
  jwt.sign({ sub: 'u7@museo.com', userId, role }, "test-secret", { algorithm: "HS256" });
const bearer = (role, userId) => ({ Authorization: `Bearer ${token(role, userId)}` });
const grpcError = (code, details) =>
  Object.assign(new Error(details), { code, details });

beforeEach(() => {
  call.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("autenticación y autorización", () => {
  test("sin token -> 401", async () => {
    const res = await request(app).get(URL);
    expect(res.status).toBe(401);
  });

  test("token inválido -> 401", async () => {
    const res = await request(app).get(URL).set("Authorization", "Bearer basura");
    expect(res.status).toBe(401);
  });

  test("rol inexistente -> 403", async () => {
    const res = await request(app).get(URL).set(bearer("INTRUSO"));
    expect(res.status).toBe(403);
  });

  test.each(["CURADOR", "ADMINISTRADOR"])("rol %s -> 403", async (role) => {
    const res = await request(app).get(URL).set(bearer(role));
    expect(res.status).toBe(403);
    expect(call).not.toHaveBeenCalled();
  });
});

describe("validación de limit", () => {
  test.each([
    ["texto", "abc"],
    ["negativo", "-1"],
    ["cero", "0"],
    ["decimal", "1.5"],
    ["fuera de int32", "2147483648"],
  ])("limit %s -> 400", async (_, limit) => {
    const res = await request(app).get(URL).query({ limit }).set(bearer());
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("limit debe ser un entero entre 1 y 2147483647");
    expect(call).not.toHaveBeenCalled();
  });

  test("limit ausente -> usa el valor por defecto", async () => {
    call.mockResolvedValue({ recommendations: [] });

    await request(app).get(URL).set(bearer());

    expect(call).toHaveBeenCalledWith(
      worksClient,
      "GetRecommendedWorks",
      { user_id: 7, limit: 5 },
      { id: "7", rol: "VISITANTE" },
    );
  });

  test("limit=1 se envía tal cual", async () => {
    call.mockResolvedValue({ recommendations: [] });

    await request(app).get(URL).query({ limit: 1 }).set(bearer());

    expect(call).toHaveBeenCalledWith(
      worksClient,
      "GetRecommendedWorks",
      { user_id: 7, limit: 1 },
      { id: "7", rol: "VISITANTE" },
    );
  });
});

describe("éxito", () => {
  test("200 con rol VISITANTE", async () => {
    const payload = {
      recommendations: [
        {
          work: { id: "2", title: "Obra recomendada" },
          reasons: ["Coincide con tu técnica favorita: Óleo"],
        },
      ],
    };
    call.mockResolvedValue(payload);

    const res = await request(app)
      .get(URL)
      .query({ limit: 3 })
      .set(bearer("VISITANTE"));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(payload);
    expect(call).toHaveBeenCalledWith(
      worksClient,
      "GetRecommendedWorks",
      { user_id: 7, limit: 3 },
      { id: "7", rol: "VISITANTE" },
    );
  });

  test("el user_id sale del token y no del query", async () => {
    call.mockResolvedValue({ recommendations: [] });

    await request(app)
      .get(URL)
      .query({ user_id: 99, limit: 2 })
      .set(bearer("VISITANTE", 7));

    expect(call).toHaveBeenCalledWith(
      worksClient,
      "GetRecommendedWorks",
      { user_id: 7, limit: 2 },
      { id: "7", rol: "VISITANTE" },
    );
  });
});

describe("traducción de errores gRPC", () => {
  test.each([
    ["INVALID_ARGUMENT", 400, grpc.status.INVALID_ARGUMENT],
    ["NOT_FOUND", 404, grpc.status.NOT_FOUND],
    ["UNAVAILABLE", 503, grpc.status.UNAVAILABLE],
    ["DEADLINE_EXCEEDED", 504, grpc.status.DEADLINE_EXCEEDED],
    ["INTERNAL (resto)", 500, grpc.status.INTERNAL],
  ])("%s -> HTTP %i", async (_, http, code) => {
    call.mockRejectedValue(grpcError(code, "detalle del servicio"));

    const res = await request(app).get(URL).set(bearer());

    expect(res.status).toBe(http);
    expect(res.body.error).toBeDefined();
  });
});
