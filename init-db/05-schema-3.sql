-- Museo Virtual - Hito 3: Transactional Outbox para novedades de eventos
--
-- Se ejecuta solo cuando MySQL inicializa un volumen nuevo. En una base ya
-- existente, ejecutar este script manualmente o recrear el volumen con
-- `docker compose down -v`.

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS event_outbox (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    message_id           CHAR(36)     NOT NULL,
    news_type            VARCHAR(30)  NOT NULL,
    event_id             BIGINT       NOT NULL,
    event_title          VARCHAR(255) NOT NULL,
    event_datetime       DATETIME     NULL,
    event_type           VARCHAR(20)  NULL,
    lead_curator_id      BIGINT       NULL,
    occurred_at          DATETIME(3)  NOT NULL,
    responsible_user_id  BIGINT       NULL,
    changes_json         TEXT         NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    attempts             INT          NOT NULL DEFAULT 0,
    next_attempt_at      DATETIME(3)  NOT NULL,
    sent_at              DATETIME(3)  NULL,
    last_error           VARCHAR(500) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_event_outbox_message_id (message_id),
    KEY idx_event_outbox_pending (status, next_attempt_at),
    KEY idx_event_outbox_event_id (event_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
