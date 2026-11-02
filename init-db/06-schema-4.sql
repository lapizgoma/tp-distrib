SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS audit_log (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    message_id          CHAR(36)     NOT NULL,
    schema_version      INT          NOT NULL,
    news_type           VARCHAR(30)  NOT NULL,
    event_id            BIGINT       NOT NULL,
    event_title         VARCHAR(255) NOT NULL,
    event_datetime      DATETIME     NULL,
    event_type          VARCHAR(20)  NULL,
    lead_curator_id     BIGINT       NULL,
    responsible_user_id BIGINT       NULL,
    occurred_at         DATETIME(3)  NOT NULL,
    source              VARCHAR(50)  NOT NULL,
    changes_json        JSON         NULL,
    payload_json        JSON         NOT NULL,
    kafka_topic         VARCHAR(255) NOT NULL,
    kafka_partition     INT          NOT NULL,
    kafka_offset        BIGINT       NOT NULL,
    consumed_at         DATETIME(3)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_audit_message_id (message_id),
    KEY idx_audit_event (event_id, occurred_at),
    KEY idx_audit_occurred (occurred_at),
    KEY idx_audit_news_type (news_type, occurred_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
