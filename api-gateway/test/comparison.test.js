import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import grpc from "@grpc/grpc-js";
import { createApp } from "../src/app.js";

const worksClient = {};
const call = jest.fn();
const app = createApp({ clients: { works: worksClient }, call });

const URL = "/api/grpc/works/compare";

const token = (role = "VISITANTE") =>
  jwt.sign({ sub: "7", role }, "test-secret", { algorithm: "HS256" });
const bearer = (role) => ({ Authorization: `Bearer ${token(role)}` });
const grpcError = (code, details) =>
  Object.assign(new Error(details), { code, details });

beforeEach(() => {
  call.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("autenticación y autorización", () => {
  test("sin token -> 401", async () => {
    const res = await request(app)
      .post(URL)
      .send({ work_ids: [1, 2] });
    expect(res.status).toBe(401);
  });

  test("token inválido -> 401", async () => {
    const res = await request(app)
      .post(URL)
      .set("Authorization", "Bearer basura")
      .send({ work_ids: [1, 2] });
    expect(res.status).toBe(401);
  });

  test("rol inexistente -> 403", async () => {
    const res = await request(app)
      .post(URL)
      .set(bearer("INTRUSO"))
      .send({ work_ids: [1, 2] });
    expect(res.status).toBe(403);
  });
});

describe("validación del body", () => {
  test.each([
    ["sin work_ids", {}],
    ["work_ids no es array", { work_ids: "abc" }],
    ["ids no enteros", { work_ids: [1, "x"] }],
    ["ids negativos", { work_ids: [1, -2] }],
    ["menos de 2 distintos", { work_ids: [3, 3] }],
  ])("%s -> 400", async (_, body) => {
    const res = await request(app).post(URL).set(bearer()).send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(call).not.toHaveBeenCalled();
  });

  test("JSON mal formado -> 400", async () => {
    const res = await request(app)
      .post(URL)
      .set(bearer())
      .set("Content-Type", "application/json")
      .send("{no es json");
    expect(res.status).toBe(400);
  });
});

describe("éxito", () => {
  test.each(["VISITANTE", "CURADOR", "ADMINISTRADOR"])(
    "200 con rol %s",
    async (role) => {
      const payload = {
        works: [
          { id: "1", title: "A" },
          { id: "4", title: "B" },
        ],
      };
      call.mockResolvedValue(payload);

      const res = await request(app)
        .post(URL)
        .set(bearer(role))
        .send({ work_ids: [1, 4] });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(payload);
      expect(call).toHaveBeenCalledWith(
        worksClient,
        "GetWorksForComparison",
        { work_ids: [1, 4] },
        { id: "7", rol: role },
      );
    },
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
    call.mockRejectedValue(grpcError(code, "detalle del servicio"));

    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send({ work_ids: [1, 2] });

    expect(res.status).toBe(http);
    expect(res.body.error).toBeDefined();
  });

  test("NOT_FOUND conserva el mensaje con los ids faltantes", async () => {
    call.mockRejectedValue(
      grpcError(grpc.status.NOT_FOUND, "Obras inexistentes: 99, 100"),
    );
    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send({ work_ids: [99, 100] });
    expect(res.body.error).toBe("Obras inexistentes: 99, 100");
  });
});
