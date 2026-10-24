-- ============================================================
-- Museo Virtual - Datos de prueba Hito 2
-- Completa las columnas y tablas agregadas por 03-schema-2.sql.
--
-- Idempotente:
--   - Obras y eventos se actualizan por ID.
--   - Preferencias usan ON DUPLICATE KEY UPDATE.
--   - Interacciones usan NOT EXISTS para no duplicarse.
--
-- Requiere que 02-data.sql y 03-schema-2.sql ya se hayan ejecutado.
-- ============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 1. Obras: duración estimada y temas de prueba
UPDATE works w
JOIN (
    SELECT 1 AS id, 15 AS estimated_duration_minutes, 'Naturaleza,Paisaje,Nocturno' AS topics
    UNION ALL SELECT 2,  10, 'Naturaleza,Bodegón,Flores'
    UNION ALL SELECT 3,  10, 'Vida cotidiana,Interior'
    UNION ALL SELECT 4,  10, 'Paisaje,Mar,Naturaleza'
    UNION ALL SELECT 5,  15, 'Naturaleza,Agua,Flores'
    UNION ALL SELECT 6,  20, 'Retrato,Renacimiento'
    UNION ALL SELECT 7,  20, 'Religión,Historia'
    UNION ALL SELECT 8,  15, 'Retrato,Identidad,Simbolismo'
    UNION ALL SELECT 9,  10, 'Retrato,Dolor,Simbolismo'
    UNION ALL SELECT 10, 20, 'Guerra,Historia,Política'
    UNION ALL SELECT 11, 15, 'Amor,Retrato,Modernismo'
    UNION ALL SELECT 12, 10, 'Retrato,Barroco'
    UNION ALL SELECT 13, 10, 'Surrealismo,Tiempo,Sueños'
    UNION ALL SELECT 14, 15, 'Vida cotidiana,Nocturno,Paisaje'
    UNION ALL SELECT 15, 10, 'Naturaleza,Paisaje,Jardín'
) seed ON seed.id = w.id
SET w.estimated_duration_minutes = seed.estimated_duration_minutes,
    w.topics = seed.topics;

-- 2. Eventos: ubicación y era asociada
UPDATE events e
JOIN (
    SELECT 1 AS id, 'SALA_1_GRANDES_MAESTROS' AS location, 'RENACIMIENTO' AS associated_era
    UNION ALL SELECT 2,  'SALA_4_ARTE_MODERNO', 'CONTEMPORANEO'
    UNION ALL SELECT 3,  'SALA_2_IMPRESIONISMO', 'IMPRESIONISMO'
    UNION ALL SELECT 4,  'SALA_4_ARTE_MODERNO', 'VANGUARDIA'
    UNION ALL SELECT 5,  'SALA_3_VANGUARDIAS', 'VANGUARDIA'
    UNION ALL SELECT 6,  'SALA_3_VANGUARDIAS', 'VANGUARDIA'
    UNION ALL SELECT 7,  'SALA_3_VANGUARDIAS', 'VANGUARDIA'
    UNION ALL SELECT 8,  'SALA_2_IMPRESIONISMO', 'IMPRESIONISMO'
    UNION ALL SELECT 9,  'SALA_1_GRANDES_MAESTROS', 'BARROCO'
    UNION ALL SELECT 10, 'SALA_4_ARTE_MODERNO', 'CONTEMPORANEO'
) seed ON seed.id = e.id
SET e.location = seed.location,
    e.associated_era = seed.associated_era;

-- 2b. Eventos demo agendados
-- Grupo A (+2 días): recorrido completo desde las 10:00.
-- Grupo B (+5 días): filtrar por Vanguardia y empezar a las 15:00.
INSERT IGNORE INTO events (
    id,
    title,
    description,
    datetime,
    duration,
    lead_curator_id,
    maximum_capacity,
    event_type,
    location,
    associated_era
) VALUES
    (
        11,
        'Visita guiada: Grandes Maestros',
        'Recorrido por el Renacimiento y el Barroco de la Sala 1.',
        DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 10 HOUR + INTERVAL 10 MINUTE,
        60,
        (SELECT id FROM users WHERE email = 'curador@museo.com'),
        25,
        'VISITA_GUIADA',
        'SALA_1_GRANDES_MAESTROS',
        'RENACIMIENTO'
    ),
    (
        12,
        'Charla: Impresionismo',
        'Charla sobre luz y color en la Sala 2.',
        DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 10 HOUR + INTERVAL 40 MINUTE,
        60,
        (SELECT id FROM users WHERE email = 'curador2@museo.com'),
        40,
        'CHARLA',
        'SALA_2_IMPRESIONISMO',
        'IMPRESIONISMO'
    ),
    (
        13,
        'Visita guiada: Vanguardias',
        'Recorrido por las obras de vanguardia de la Sala 3.',
        DATE_ADD(CURDATE(), INTERVAL 5 DAY) + INTERVAL 15 HOUR + INTERVAL 10 MINUTE,
        45,
        (SELECT id FROM users WHERE email = 'curador@museo.com'),
        25,
        'VISITA_GUIADA',
        'SALA_3_VANGUARDIAS',
        'VANGUARDIA'
    ),
    (
        14,
        'Taller: arte moderno',
        'Taller práctico inspirado en las obras de la Sala 4.',
        DATE_ADD(CURDATE(), INTERVAL 5 DAY) + INTERVAL 15 HOUR + INTERVAL 40 MINUTE,
        90,
        (SELECT id FROM users WHERE email = 'curador2@museo.com'),
        20,
        'TALLER',
        'SALA_4_ARTE_MODERNO',
        'VANGUARDIA'
    );

-- 3. Preferencias de usuario
-- Los IDs se resuelven por email porque users usa AUTO_INCREMENT.
SET @visitanteId := (SELECT id FROM users WHERE email = 'visitante@museo.com');
SET @visitante01Id := (SELECT id FROM users WHERE email = 'visitante01@museo.com');
SET @visitante02Id := (SELECT id FROM users WHERE email = 'visitante02@museo.com');

INSERT INTO user_preferences (
    user_id,
    favorite_topics,
    favorite_techniques,
    favorite_eras
)
VALUES
    (
        @visitanteId,
        JSON_ARRAY('Naturaleza', 'Retrato'),
        JSON_ARRAY('OLEO'),
        JSON_ARRAY('IMPRESIONISMO', 'VANGUARDIA')
    ),
    (
        @visitante01Id,
        JSON_ARRAY('Guerra', 'Historia'),
        JSON_ARRAY('OLEO'),
        JSON_ARRAY('VANGUARDIA')
    ),
    (
        @visitante02Id,
        JSON_ARRAY('Religión', 'Retrato'),
        JSON_ARRAY('TEMPLE', 'OLEO'),
        JSON_ARRAY('RENACIMIENTO', 'BARROCO')
    )
ON DUPLICATE KEY UPDATE
    favorite_topics = VALUES(favorite_topics),
    favorite_techniques = VALUES(favorite_techniques),
    favorite_eras = VALUES(favorite_eras);

-- 4. Interacciones de usuario
-- Se evita duplicar filas al volver a ejecutar el script.
INSERT INTO user_work_interactions (user_id, work_id, interaction_type)
SELECT seed.user_id, seed.work_id, seed.interaction_type
FROM (
    SELECT @visitanteId AS user_id, 1 AS work_id, 'VIEW' AS interaction_type
    UNION ALL SELECT @visitanteId, 1, 'COMMENT'
    UNION ALL SELECT @visitanteId, 4, 'VIEW'
    UNION ALL SELECT @visitanteId, 10, 'VIEW'
    UNION ALL SELECT @visitante01Id, 10, 'VIEW'
    UNION ALL SELECT @visitante01Id, 10, 'COMMENT'
    UNION ALL SELECT @visitante01Id, 11, 'VIEW'
    UNION ALL SELECT @visitante02Id, 6, 'VIEW'
    UNION ALL SELECT @visitante02Id, 12, 'COMMENT'
) seed
WHERE seed.user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM user_work_interactions uwi
      WHERE uwi.user_id = seed.user_id
        AND uwi.work_id = seed.work_id
        AND uwi.interaction_type = seed.interaction_type
  );
