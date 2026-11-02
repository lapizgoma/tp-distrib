# Trabajo Práctico - Desarrollo de Software en Sistemas Distribuidos

Trabajo práctico grupal para la materia "Desarrollo de Software en Sistemas Distribuidos". El sistema implementa un museo virtual con backends REST, GraphQL y gRPC, un proxy que unifica el acceso y un frontend en React.

## Integrantes
* Luciano Rodriguez
* Ariel Mendoza
* Luca Lazarte
* Julián Valiño

## Arquitectura

El frontend (React + Vite) corre en el host y consume todo a través de `/api`, que Vite proxya a `http://localhost:8080` (el `backend-proxy`). El proxy deriva las requests a REST, GraphQL, al API Gateway de gRPC, a notificaciones o a auditoría según corresponda.

| Servicio | Tecnología | Puerto | Descripción |
| --- | --- | --- | --- |
| `front-react` | React + Vite | 5173 | Interfaz de usuario (corre fuera de Docker) |
| `backend-proxy` | Go | 8080 | Punto de entrada único para el frontend |
| `backend-rest` | Java (Spring Boot) | 8081 | API REST |
| `backend-graphql` | Go | 8082 | API GraphQL |
| `audit` | Go | 8083 | Consumidor de eventos y API de auditoría |
| `notifications` | Node.js | 8084 | Consumidor de eventos y API de notificaciones |
| `api-gateway` | Node.js | 8090 | Gateway de los servicios gRPC |
| `grpc-works` | Python | 50051 | Servicio gRPC de obras |
| `grpc-events` | Python | 50052 | Servicio gRPC de eventos |
| `grpc-users` | Python | 50053 | Servicio gRPC de usuarios |
| `kafka` | Apache Kafka 4.3.1 (KRaft) | 29092 | Broker de mensajería asíncrona |
| `kafka-ui` | Kafbat UI | 8085 | Consola web opcional para topics y mensajes |
| `mysql` | MySQL 8 | 3306 | Base de datos (`museo_virtual`) |

## Requisitos previos

* **Docker Desktop** con Docker Compose v2 (el compose usa `profiles` y `additional_contexts`).
* **Node.js >= 20.19** y **npm** (probado con Node 24).
* **Git**.

## Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/lapizgoma/tp-distrib.git
cd tp-distrib
```

### 2. Configurar las variables de entorno

```bash
cp .env-example .env
```

En Windows (PowerShell):

```powershell
Copy-Item .env-example .env
```

El compose trae valores por defecto, así que este paso no es obligatorio para desarrollo, pero permite ajustar puertos, credenciales y secretos.

### 3. Levantar el backend con Docker

Con Docker Desktop abierto, desde la raíz del proyecto:

```bash
docker compose --profile full up --build
```

* `--profile full` levanta todos los servicios: MySQL, REST, GraphQL, proxy, gRPC y API Gateway.
* `--build` fuerza la reconstrucción de las imágenes. La primera vez tarda varios minutos (Maven, Go y Python); en arranques posteriores podés omitirlo.
* Agregá `-d` si querés dejar los contenedores en segundo plano.

Esperá a que MySQL quede healthy y a que terminen de arrancar todos los servicios. Podés seguir el estado con:

```bash
docker compose --profile full ps
docker compose --profile full logs -f
```

### 4. Levantar el frontend

El frontend **no está dockerizado**, se ejecuta aparte con Vite:

```bash
cd front-react
npm install
npm run dev
```

### 5. Acceder a la aplicación

* Frontend: http://localhost:5173
* Proxy (API unificada): http://localhost:8080
* REST directo: http://localhost:8081
* GraphQL directo: http://localhost:8082
* API Gateway gRPC: http://localhost:8090
* Kafka UI: http://localhost:8085

## Mensajería asíncrona

El backend REST publica novedades de eventos en Kafka usando el patrón
**Transactional Outbox**:

1. La operación sobre el evento y una fila en `event_outbox` se guardan en la
   misma transacción MySQL.
2. Un worker programado lee las filas `PENDING` y las publica en
   `museum.events`.
3. Si Kafka no está disponible, la novedad queda persistida y se reintenta con
   backoff exponencial. La API REST sigue respondiendo.
4. El mensaje usa el `eventId` como clave de Kafka para conservar el orden por
   evento. La entrega es at-least-once; los consumidores deben deduplicar por
   `messageId`.

Topics creados automáticamente por `kafka-init`:

* `museum.events`: alta, modificación y cancelación de eventos.
* `audit-dlq`: topic de descarte del consumidor de auditoría.
* `notification-dlq`: topic de descarte del consumidor de notificaciones.

La tabla `event_outbox` se crea con `init-db/05-schema-3.sql`. Si ya tenías un
volumen de MySQL con la tabla creada antes de incorporar el diff de auditoría,
agregá la columna manualmente:

```sql
ALTER TABLE event_outbox
    ADD COLUMN changes_json TEXT NULL AFTER responsible_user_id;
```

También podés recrear el volumen con `docker compose down -v` (borra los datos).

Tipos de novedad: `EVENT_CREATED`, `EVENT_UPDATED`, `EVENT_CANCELLED`.

Ejemplo de alta o cancelación:

```json
{
  "schemaVersion": 1,
  "messageId": "7f0c9d2e-4a1b-4c3d-9e8f-123456789abc",
  "newsType": "EVENT_CREATED",
  "eventId": 12,
  "eventTitle": "Noche de Gala en el Museo",
  "eventDateTime": "2026-11-15T20:00:00",
  "eventType": "VISITA_GUIADA",
  "leadCuratorId": 2,
  "occurredAt": "2026-10-29T14:03:11Z",
  "responsibleUserId": 5,
  "source": "backend-rest"
}
```

Para `EVENT_UPDATED`, el mensaje conserva el snapshot nuevo en los campos
principales y agrega `changes` con los valores anterior y posterior de cada
campo modificado. Solo se publica si hubo al menos un cambio relevante:

```json
{
  "schemaVersion": 1,
  "messageId": "ecc61a21-85de-41d3-9f14-aec546345cdc",
  "newsType": "EVENT_UPDATED",
  "eventId": 12,
  "eventTitle": "Charla: vanguardias del siglo XIX",
  "eventDateTime": "2026-10-30T01:49:00",
  "eventType": "CHARLA",
  "leadCuratorId": 2,
  "occurredAt": "2026-10-29T21:49:50.689Z",
  "responsibleUserId": 1,
  "source": "backend-rest",
  "changes": {
    "eventTitle": {
      "previous": "Charla: vanguardias del siglo XVIII",
      "current": "Charla: vanguardias del siglo XIX"
    },
    "eventDateTime": {
      "previous": "2026-10-30T01:49:00",
      "current": "2026-11-02T18:00:00"
    },
    "leadCuratorId": {
      "previous": 3,
      "current": 2
    }
  }
}
```

Campos que pueden aparecer en `changes`: `eventTitle`, `description`,
`eventDateTime`, `duration`, `leadCuratorId`, `maximumCapacity`, `eventType`.
Los valores mantienen su tipo JSON: texto, número, enum o `null`.

## Auditoría

El servicio `audit` consume `museum.events` con su propio grupo
(`audit-service`) y persiste cada novedad en la tabla `audit_log`. Deduplica por
`message_id` y confirma el offset de Kafka recién después del `INSERT`, así que
un mensaje no se pierde si el proceso se cae. Los mensajes inválidos o que no se
pueden persistir se copian a `audit-dlq`.

La consulta se hace con:

```
GET /api/audit/events
```

A través del proxy unificado queda en
`http://localhost:8080/api/audit/events`; también se puede llamar directo al
servicio en `http://localhost:8083/api/audit/events`. Requiere un JWT con rol
`CURADOR` o `ADMINISTRADOR` (mismo `JWT_SECRET` y `JWT_ISSUER` que el backend
REST).

Parámetros opcionales (se combinan con AND):

| Parámetro | Descripción |
| --- | --- |
| `eventId` | ID del evento |
| `newsType` | `EVENT_CREATED`, `EVENT_UPDATED` o `EVENT_CANCELLED` |
| `responsibleUserId` | ID del usuario que realizó la operación |
| `from` / `to` | Rango de `occurredAt` en RFC3339 (UTC) |
| `includePayload` | `true` para incluir el mensaje original en `payload` |
| `page` | Página, desde `0` (default `0`) |
| `size` | Tamaño de página entre `1` y `200` (default `50`) |

La respuesta tiene la forma `{ "content": [...], "page": 0, "size": 50,
"hasMore": false }`, ordenada por `occurredAt` y luego por `id`.

```bash
curl "http://localhost:8080/api/audit/events?newsType=EVENT_UPDATED&size=10" \
  -H "Authorization: Bearer $TOKEN"
```

## Notificaciones

El servicio `notifications` consume `museum.events` con su propio grupo
(`notification-service`) y guarda una notificación por destinatario en la tabla
`notifications`:

* `EVENT_CREATED`: todos los usuarios con rol `VISITANTE`.
* `EVENT_UPDATED` y `EVENT_CANCELLED`: los usuarios inscriptos al evento.

Deduplica por `(message_id, user_id)`: si el mensaje se reentrega, no se
duplican filas. El offset de Kafka se confirma recién después del `INSERT`; los
mensajes inválidos o que agotan los reintentos se copian a `notification-dlq`.

Consulta:

```
GET   /api/notifications
PATCH /api/notifications/read
```

Por el proxy unificado quedan en `http://localhost:8080/api/notifications` y
`http://localhost:8080/api/notifications/read`; directo al servicio, en el
puerto `8084`. Requieren un JWT válido (mismo `JWT_SECRET` y `JWT_ISSUER` que
el backend REST). El `userId` sale del token, así que cada usuario ve solo sus
notificaciones, sin importar el rol.

`GET /api/notifications`:

| Parámetro | Descripción |
| --- | --- |
| `page` | Página, desde `0` (default `0`) |
| `size` | Tamaño de página entre `1` y `50` (default `20`) |
| `unreadOnly` | `true` para traer solo las no leídas |

La respuesta tiene la forma `{ "content": [...], "page": 0, "size": 20,
"hasMore": false }`, de la más nueva a la más vieja. Cada elemento incluye
`id`, `messageId`, `eventId`, `newsType`, `title`, `message`, `isRead` y
`createdAt`.

`PATCH /api/notifications/read` marca como leídas todas las notificaciones del
usuario y responde `204`.

```bash
curl "http://localhost:8080/api/notifications?unreadOnly=true&size=5" \
  -H "Authorization: Bearer $TOKEN"

curl -X PATCH "http://localhost:8080/api/notifications/read" \
  -H "Authorization: Bearer $TOKEN"
```

El frontend muestra una campanita en el header con un punto rojo cuando hay
notificaciones sin leer (sin mostrar cantidad). Al abrir el panel se listan y se
marcan como leídas.

La columna `is_read` se crea con `init-db/07-schema-5.sql`. Si ya tenías un
volumen de MySQL inicializado antes de este cambio, agregala manualmente:

```sql
ALTER TABLE notifications
    ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE AFTER message,
    ADD KEY idx_notifications_user_read (user_id, is_read, created_at);
```

También podés recrear el volumen con `docker compose down -v` (borra los datos).

## Comandos útiles

```bash
# Ver logs de un servicio puntual
docker compose --profile full logs -f backend-rest

# Bajar los contenedores
docker compose --profile full down

# Bajar y borrar la base de datos (se vuelve a inicializar en el próximo up)
docker compose --profile full down -v

# Levantar solo un subconjunto
docker compose --profile rest up --build
docker compose --profile graphql up --build
docker compose --profile grpc up --build

# Kafka: topics y mensajes
docker compose --profile rest logs -f kafka backend-rest
docker exec -it museo-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
docker exec -it museo-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic museum.events --from-beginning \
  --property print.key=true

# Frontend: lint y build de producción
cd front-react
npm run lint
npm run build
```

## Estructura del repositorio

```
.
├── api-gateway/        # Gateway Node.js para gRPC
├── audit/              # Consumidor de auditoría y API de consulta (Go)
├── backend-graphql/    # Backend GraphQL (Go)
├── backend-proxy/      # Proxy unificado (Go)
├── backend-rest/       # Backend REST (Java)
├── front-react/        # Frontend React + Vite
├── grpc-events/        # Servicio gRPC de eventos (Python)
├── grpc-users/         # Servicio gRPC de usuarios (Python)
├── grpc-works/         # Servicio gRPC de obras (Python)
├── init-db/            # Scripts de inicialización de MySQL
├── notifications/      # Consumidor de eventos y API de notificaciones (Node.js)
├── protos/             # Definiciones .proto compartidas
└── docker-compose.yaml
```

## Notas

* La base de datos se inicializa automáticamente la primera vez que arranca MySQL, usando los scripts de `init-db/`. Incluye datos de prueba; si necesitás reiniciarla desde cero, usá `down -v`.
* Las imágenes de los backends se cachean. Si modificás código, volvé a ejecutar `docker compose --profile full up --build` para reconstruirlas.
* Si algún puerto ya está en uso, cambialo en `.env` (por ejemplo `DB_PORT` o `GRPC_WORKS_PORT`) y reiniciá el compose.
