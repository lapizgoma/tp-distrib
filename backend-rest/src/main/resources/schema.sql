-- ============================================================
-- Museo Virtual - Esquema de base de datos (MySQL 8+)
-- Motor: InnoDB | Charset: utf8mb4
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL,
    first_name  VARCHAR(100) NULL,
    last_name   VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS artists (
    id        BIGINT       NOT NULL AUTO_INCREMENT,
    name      VARCHAR(255) NOT NULL,
    biography TEXT         NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS works (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    title          VARCHAR(255) NOT NULL,
    artist_id      BIGINT       NOT NULL,
    image_url      VARCHAR(500) NULL,
    creation_year  INT          NULL,
    technique      VARCHAR(100) NULL,
    dimensions     VARCHAR(100) NULL,
    era            VARCHAR(100) NULL,
    description    TEXT         NULL,
    location       VARCHAR(255) NULL,
    availability   VARCHAR(20)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_works_artist FOREIGN KEY (artist_id) REFERENCES artists (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS comments (
    id      BIGINT   NOT NULL AUTO_INCREMENT,
    user_id BIGINT   NOT NULL,
    work_id BIGINT   NOT NULL,
    text    TEXT     NOT NULL,
    date    DATETIME NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_comments_work FOREIGN KEY (work_id) REFERENCES works (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS events (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    title             VARCHAR(255) NOT NULL,
    description       TEXT         NULL,
    datetime          DATETIME     NOT NULL,
    duration          INT          NULL,
    lead_curator_id   BIGINT       NOT NULL,
    maximum_capacity  INT          NOT NULL,
    event_type        VARCHAR(20)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_events_lead_curator FOREIGN KEY (lead_curator_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS events_registrations (
    event_id      BIGINT   NOT NULL,
    user_id       BIGINT   NOT NULL,
    registered_at DATETIME NOT NULL,
    PRIMARY KEY (event_id, user_id),
    CONSTRAINT fk_ereg_event FOREIGN KEY (event_id) REFERENCES events (id),
    CONSTRAINT fk_ereg_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS saved_event_filters (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    name          VARCHAR(255) NOT NULL,
    description   TEXT         NULL,
    filter_config JSON         NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_saved_filters_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ============================================================
-- Índices sobre claves ajenas y campos de consulta frecuente
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_works_artist_id ON works (artist_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_work_id ON comments (work_id);
CREATE INDEX IF NOT EXISTS idx_events_datetime ON events (datetime);
CREATE INDEX IF NOT EXISTS idx_events_lead_curator_id ON events (lead_curator_id);
CREATE INDEX IF NOT EXISTS idx_ereg_event_id ON events_registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_ereg_user_id ON events_registrations (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON saved_event_filters (user_id);