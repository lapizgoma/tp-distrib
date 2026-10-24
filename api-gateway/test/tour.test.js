import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import grpc from "@grpc/grpc-js";
import { createApp } from "../src/app.js";

const worksClient = {};
const eventsClient = {};
const call = jest.fn();
const app = createApp({ clients: { works: worksClient, events: eventsClient }, call });

const URL = "/api/grpc/tours/plan";
const user = { id: "7", rol: "VISITANTE" };

const token = (role = "VISITANTE") =>
  jwt.sign({ sub: "7", role }, "test-secret", { algorithm: "HS256" });
const bearer = (role) => ({ Authorization: `Bearer ${token(role)}` });
const grpcError = (code, details) =>
  Object.assign(new Error(details), { code, details });

const criteria = {
  topics: ["Naturaleza"],
  eras: ["Impresionismo"],
  techniques: ["Oleo"],
  max_duration_minutes: 120,
  max_works_count: 8,
};

const plan = {
  works: [
    { id: "1", title: "Obra A" },
    { id: "2", title: "Obra B" },
  ],
  total_duration_minutes: 30,
  rooms: ["sala_2_impresionismo", "sala_4_arte_moderno"],
  notes: [],
};

const eventsPayload = {
  events: [
    { id: "10", title: "Visita guiada", location: "SALA_2_IMPRESIONISMO" },
  ],
};

beforeEach(() => {
  call.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("autenticación y autorización", () => {
  test("sin token -> 401", async () => {
    const res = await request(app).post(URL).send(criteria);
    expect(res.status).toBe(401);
  });

  test("token inválido -> 401", async () => {
    const res = await request(app)
      .post(URL)
      .set("Authorization", "Bearer basura")
      .send(criteria);
    expect(res.status).toBe(401);
  });

  test.each(["CURADOR", "ADMINISTRADOR"])("rol %s -> 403", async (role) => {
    const res = await request(app)
      .post(URL)
      .set(bearer(role))
      .send(criteria);

    expect(res.status).toBe(403);
    expect(call).not.toHaveBeenCalled();
  });
});

describe("validación del body", () => {
  test.each([
    ["topics no es array", { topics: "Naturaleza" }],
    ["topics con un número", { topics: ["Naturaleza", 3] }],
    ["topics con un string vacío", { topics: ["Naturaleza", " "] }],
    ["eras null", { eras: null }],
    ["techniques con un objeto", { techniques: [{}] }],
    ["duración negativa", { max_duration_minutes: -1 }],
    ["duración decimal", { max_duration_minutes: 1.5 }],
    ["duración string", { max_duration_minutes: "120" }],
    ["cantidad boolean", { max_works_count: true }],
    ["cantidad fuera de int32", { max_works_count: 2147483648 }],
    ["body array", []],
  ])("%s -> 400", async (_, body) => {
    const res = await request(app).post(URL).set(bearer()).send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(call).not.toHaveBeenCalled();
  });

  test("body null -> 400", async () => {
    const res = await request(app)
      .post(URL)
      .set(bearer())
      .set("Content-Type", "application/json")
      .send("null");

    expect(res.status).toBe(400);
    expect(call).not.toHaveBeenCalled();
  });

  test("JSON mal formado -> 400", async () => {
    const res = await request(app)
      .post(URL)
      .set(bearer())
      .set("Content-Type", "application/json")
      .send("{no es json");

    expect(res.status).toBe(400);
    expect(call).not.toHaveBeenCalled();
  });
});

describe("éxito", () => {
  test("VISITANTE recibe el plan combinado con eventos futuros", async () => {
    call.mockImplementation((client, method) => {
      if (method === "SearchWorksForTour") return Promise.resolve(plan);
      if (method === "GetEventsByLocations") return Promise.resolve(eventsPayload);
      return Promise.reject(new Error(`método inesperado: ${method}`));
    });

    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send(criteria);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...plan, events: eventsPayload.events });
    expect(call).toHaveBeenNthCalledWith(
      1,
      worksClient,
      "SearchWorksForTour",
      criteria,
      user,
    );
    expect(call).toHaveBeenNthCalledWith(
      2,
      eventsClient,
      "GetEventsByLocations",
      { locations: plan.rooms, only_future: true },
      user,
    );
  });

  test("body vacío aplica criterios por defecto", async () => {
    call.mockImplementation((client, method) => {
      if (method === "SearchWorksForTour") return Promise.resolve(plan);
      if (method === "GetEventsByLocations") return Promise.resolve(eventsPayload);
      return Promise.reject(new Error(`método inesperado: ${method}`));
    });

    const res = await request(app).post(URL).set(bearer()).send({});

    expect(res.status).toBe(200);
    expect(call).toHaveBeenNthCalledWith(
      1,
      worksClient,
      "SearchWorksForTour",
      {
        topics: [],
        eras: [],
        techniques: [],
        max_duration_minutes: 0,
        max_works_count: 0,
      },
      user,
    );
  });

  test("sin salas no consulta eventos y devuelve events vacío", async () => {
    const emptyPlan = { ...plan, works: [], rooms: [] };
    call.mockResolvedValue(emptyPlan);

    const res = await request(app).post(URL).set(bearer()).send(criteria);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...emptyPlan, events: [] });
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith(
      worksClient,
      "SearchWorksForTour",
      criteria,
      user,
    );
  });
});

describe("traducción de errores gRPC", () => {
  test("error de works -> HTTP traducido", async () => {
    call.mockRejectedValueOnce(grpcError(grpc.status.UNAVAILABLE, "works caído"));

    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send(criteria);

    expect(res.status).toBe(503);
    expect(res.body.error).toBe("works caído");
    expect(call).toHaveBeenCalledTimes(1);
  });

  test("error de events -> HTTP traducido", async () => {
    call
      .mockResolvedValueOnce(plan)
      .mockRejectedValueOnce(grpcError(grpc.status.DEADLINE_EXCEEDED, "events timeout"));

    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send(criteria);

    expect(res.status).toBe(504);
    expect(res.body.error).toBe("events timeout");
    expect(call).toHaveBeenCalledTimes(2);
  });
});
