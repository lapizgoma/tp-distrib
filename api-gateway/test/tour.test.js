import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import grpc from "@grpc/grpc-js";
import { createApp } from "../src/app.js";
import config from "../src/config.js";

const worksClient = {};
const eventsClient = {};
const usersClient = {};
const call = jest.fn();
const app = createApp({
  clients: { works: worksClient, events: eventsClient, users: usersClient },
  call,
});

const URL = "/api/grpc/tours/plan";
const user = { id: "7", rol: "VISITANTE" };

const token = (role = "VISITANTE") =>
  jwt.sign({ sub: "u7@museo.com", userId: 7, role }, "test-secret", { algorithm: "HS256" });
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
    {
      id: "1",
      title: "Obra A",
      location: "SALA_2_IMPRESIONISMO",
      estimated_duration_minutes: 20,
    },
    {
      id: "2",
      title: "Obra B",
      location: "SALA_4_ARTE_MODERNO",
      estimated_duration_minutes: 5,
    },
  ],
  total_duration_minutes: 30,
  rooms: ["sala_2_impresionismo", "sala_4_arte_moderno"],
  notes: [],
};

const startedCriteria = {
  ...criteria,
  start_datetime: "2026-11-01T10:00",
};

const emptyPreferences = {
  preferred_topics: [],
  preferred_eras: [],
  preferred_techniques: [],
};

const withPreferences = (value, preferences = emptyPreferences) => ({
  ...value,
  ...preferences,
});

const emptyProfile = { user_id: "7", preferences: {} };

const profile = {
  user_id: "7",
  preferences: {
    favorite_topics: ["Naturaleza"],
    favorite_eras: ["Impresionismo"],
    favorite_techniques: ["Oleo"],
  },
};

const profilePreferences = {
  preferred_topics: ["Naturaleza"],
  preferred_eras: ["Impresionismo"],
  preferred_techniques: ["Oleo"],
};

function mockCalls({ tourPlan = plan, events = eventsPayload, userProfile = emptyProfile } = {}) {
  call.mockImplementation((client, method) => {
    if (method === "GetUserProfile") return Promise.resolve(userProfile);
    if (method === "SearchWorksForTour") return Promise.resolve(tourPlan);
    if (method === "GetEventsByLocations") return Promise.resolve(events);
    return Promise.reject(new Error(`método inesperado: ${method}`));
  });
}

const eventsPayload = {
  events: [
    {
      id: "10",
      title: "Visita guiada",
      datetime: "2026-11-01T10:05:00",
      duration: 10,
      location: "SALA_2_IMPRESIONISMO",
    },
  ],
};

const scheduledPlan = {
  works: [
    {
      id: "1",
      title: "Obra A",
      location: "SALA_2_IMPRESIONISMO",
      estimated_duration_minutes: 20,
    },
    {
      id: "2",
      title: "Obra B",
      location: "SALA_2_IMPRESIONISMO",
      estimated_duration_minutes: 10,
    },
    {
      id: "3",
      title: "Obra C",
      location: "SALA_4_ARTE_MODERNO",
      estimated_duration_minutes: 15,
    },
  ],
  total_duration_minutes: 50,
  rooms: ["sala_2_impresionismo", "sala_4_arte_moderno"],
  notes: [],
};

const scheduledCriteria = startedCriteria;

const scheduledEvents = [
  {
    id: "20",
    title: "Durante la primera sala",
    datetime: "2026-11-01T10:10:00",
    duration: 15,
    location: "SALA_2_IMPRESIONISMO",
  },
  {
    id: "21",
    title: "Después de salir de la sala",
    datetime: "2026-11-01T10:35:00",
    duration: 10,
    location: "SALA_2_IMPRESIONISMO",
  },
  {
    id: "22",
    title: "Durante la segunda sala",
    datetime: "2026-11-01T10:40:00",
    duration: 5,
    location: "SALA_4_ARTE_MODERNO",
  },
  {
    id: "23",
    title: "En curso al llegar",
    datetime: "2026-11-01T10:20:00",
    duration: 30,
    location: "SALA_4_ARTE_MODERNO",
  },
  {
    id: "24",
    title: "Sala ajena al recorrido",
    datetime: "2026-11-01T10:15:00",
    duration: 10,
    location: "SALA_1_GRANDES_MAESTROS",
  },
];

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
    ["inicio no string", { start_datetime: 123 }],
    ["inicio con formato inválido", { start_datetime: "01/11/2026 10:00" }],
    ["inicio con mes inválido", { start_datetime: "2026-13-01T10:00" }],
    ["inicio con día inexistente", { start_datetime: "2026-02-31T10:00" }],
    ["use_preferences string", { use_preferences: "true" }],
    ["use_preferences número", { use_preferences: 1 }],
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
  test("VISITANTE recibe plan, agenda y eventos por sala", async () => {
    mockCalls();

    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send(startedCriteria);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ...plan,
      start_datetime: "2026-11-01T10:00:00",
      end_datetime: "2026-11-01T10:30:00",
      room_schedule: [
        {
          room: "sala_2_impresionismo",
          start_datetime: "2026-11-01T10:00:00",
          end_datetime: "2026-11-01T10:20:00",
        },
        {
          room: "sala_4_arte_moderno",
          start_datetime: "2026-11-01T10:25:00",
          end_datetime: "2026-11-01T10:30:00",
        },
      ],
      events: eventsPayload.events,
    });
    expect(call).toHaveBeenNthCalledWith(
      1,
      usersClient,
      "GetUserProfile",
      { user_id: 7 },
      user,
      config.grpc.usersDeadlineMs,
    );
    expect(call).toHaveBeenNthCalledWith(
      2,
      worksClient,
      "SearchWorksForTour",
      withPreferences(criteria),
      user,
    );
    expect(call).toHaveBeenNthCalledWith(
      3,
      eventsClient,
      "GetEventsByLocations",
      {
        locations: plan.rooms,
        only_future: false,
        start_datetime: "2026-11-01T10:00:00",
        end_datetime: "2026-11-01T10:30:00",
      },
      user,
    );
  });

  test("agenda salas y filtra eventos por franja", async () => {
    mockCalls({ tourPlan: scheduledPlan, events: { events: scheduledEvents } });

    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send(scheduledCriteria);

    expect(res.status).toBe(200);
    expect(res.body.start_datetime).toBe("2026-11-01T10:00:00");
    expect(res.body.end_datetime).toBe("2026-11-01T10:50:00");
    expect(res.body.room_schedule).toEqual([
      {
        room: "sala_2_impresionismo",
        start_datetime: "2026-11-01T10:00:00",
        end_datetime: "2026-11-01T10:30:00",
      },
      {
        room: "sala_4_arte_moderno",
        start_datetime: "2026-11-01T10:35:00",
        end_datetime: "2026-11-01T10:50:00",
      },
    ]);
    expect(res.body.events.map((event) => event.id)).toEqual(["20", "22", "23"]);
    expect(call).toHaveBeenNthCalledWith(
      2,
      worksClient,
      "SearchWorksForTour",
      withPreferences(criteria),
      user,
    );
    expect(call).toHaveBeenNthCalledWith(
      3,
      eventsClient,
      "GetEventsByLocations",
      {
        locations: scheduledPlan.rooms,
        only_future: false,
        start_datetime: "2026-11-01T10:00:00",
        end_datetime: "2026-11-01T10:50:00",
      },
      user,
    );
  });

  test("aplica las preferencias del perfil como campos preferred_*", async () => {
    mockCalls({ userProfile: profile });

    const res = await request(app).post(URL).set(bearer()).send(criteria);

    expect(res.status).toBe(200);
    expect(call).toHaveBeenNthCalledWith(
      1,
      usersClient,
      "GetUserProfile",
      { user_id: 7 },
      user,
      config.grpc.usersDeadlineMs,
    );
    expect(call).toHaveBeenNthCalledWith(
      2,
      worksClient,
      "SearchWorksForTour",
      withPreferences(criteria, profilePreferences),
      user,
    );
  });

  test("use_preferences false no consulta el perfil", async () => {
    mockCalls({ userProfile: profile });

    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send({ ...criteria, use_preferences: false });

    expect(res.status).toBe(200);
    expect(call).toHaveBeenNthCalledWith(
      1,
      worksClient,
      "SearchWorksForTour",
      withPreferences(criteria),
      user,
    );
    expect(call).toHaveBeenNthCalledWith(
      2,
      eventsClient,
      "GetEventsByLocations",
      expect.objectContaining({ locations: plan.rooms }),
      user,
    );
    expect(call).not.toHaveBeenCalledWith(
      usersClient,
      "GetUserProfile",
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  test("si Users falla, el tour continúa sin preferencias", async () => {
    call.mockImplementation((client, method) => {
      if (method === "GetUserProfile") {
        return Promise.reject(grpcError(grpc.status.UNAVAILABLE, "users caído"));
      }
      if (method === "SearchWorksForTour") return Promise.resolve(plan);
      if (method === "GetEventsByLocations") return Promise.resolve(eventsPayload);
      return Promise.reject(new Error(`método inesperado: ${method}`));
    });

    const res = await request(app).post(URL).set(bearer()).send(criteria);

    expect(res.status).toBe(200);
    expect(call).toHaveBeenNthCalledWith(
      2,
      worksClient,
      "SearchWorksForTour",
      withPreferences(criteria),
      user,
    );
  });

  test("preferred_* del body no se reenvían a works", async () => {
    mockCalls();

    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send({ ...criteria, preferred_topics: ["Spoof"] });

    expect(res.status).toBe(200);
    expect(call).toHaveBeenNthCalledWith(
      2,
      worksClient,
      "SearchWorksForTour",
      withPreferences(criteria),
      user,
    );
  });

  test("body vacío aplica criterios por defecto", async () => {
    mockCalls();

    const res = await request(app).post(URL).set(bearer()).send({});

    expect(res.status).toBe(200);
    expect(res.body.start_datetime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    expect(res.body.end_datetime).toBeTruthy();
    expect(res.body.room_schedule).toHaveLength(2);
    expect(call).toHaveBeenNthCalledWith(
      2,
      worksClient,
      "SearchWorksForTour",
      withPreferences({
        topics: [],
        eras: [],
        techniques: [],
        max_duration_minutes: 0,
        max_works_count: 0,
      }),
      user,
    );
    expect(call).toHaveBeenNthCalledWith(
      3,
      eventsClient,
      "GetEventsByLocations",
      {
        locations: plan.rooms,
        only_future: false,
        start_datetime: res.body.start_datetime,
        end_datetime: res.body.end_datetime,
      },
      user,
    );
  });

  test("start_datetime vacío usa la hora actual", async () => {
    mockCalls();

    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send({ ...criteria, start_datetime: "" });

    expect(res.status).toBe(200);
    expect(res.body.start_datetime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    expect(res.body.room_schedule).toHaveLength(2);
    expect(call).toHaveBeenNthCalledWith(
      2,
      worksClient,
      "SearchWorksForTour",
      withPreferences(criteria),
      user,
    );
  });

  test("sin salas no consulta eventos y devuelve events vacío", async () => {
    const emptyPlan = { ...plan, works: [], rooms: [] };
    mockCalls({ tourPlan: emptyPlan });

    const res = await request(app).post(URL).set(bearer()).send(startedCriteria);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ...emptyPlan,
      start_datetime: "2026-11-01T10:00:00",
      end_datetime: "2026-11-01T10:00:00",
      room_schedule: [],
      events: [],
    });
    expect(call).toHaveBeenCalledTimes(2);
    expect(call).toHaveBeenNthCalledWith(
      2,
      worksClient,
      "SearchWorksForTour",
      withPreferences(criteria),
      user,
    );
  });
});

describe("traducción de errores gRPC", () => {
  test("error de works -> HTTP traducido", async () => {
    call.mockImplementation((client, method) => {
      if (method === "GetUserProfile") return Promise.resolve(emptyProfile);
      if (method === "SearchWorksForTour") {
        return Promise.reject(grpcError(grpc.status.UNAVAILABLE, "works caído"));
      }
      return Promise.reject(new Error(`método inesperado: ${method}`));
    });

    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send(criteria);

    expect(res.status).toBe(503);
    expect(res.body.error).toBe("works caído");
    expect(call).toHaveBeenCalledTimes(2);
  });

  test("error de events -> HTTP traducido", async () => {
    call.mockImplementation((client, method) => {
      if (method === "GetUserProfile") return Promise.resolve(emptyProfile);
      if (method === "SearchWorksForTour") return Promise.resolve(plan);
      if (method === "GetEventsByLocations") {
        return Promise.reject(grpcError(grpc.status.DEADLINE_EXCEEDED, "events timeout"));
      }
      return Promise.reject(new Error(`método inesperado: ${method}`));
    });

    const res = await request(app)
      .post(URL)
      .set(bearer())
      .send(criteria);

    expect(res.status).toBe(504);
    expect(res.body.error).toBe("events timeout");
    expect(call).toHaveBeenCalledTimes(3);
  });
});
