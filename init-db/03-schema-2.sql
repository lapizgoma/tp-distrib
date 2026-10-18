-- Museo Virtual - Hito 2 Database Extension

-- 1. Extend 'works' table
ALTER TABLE works 
    ADD COLUMN estimated_duration_minutes INT NOT NULL DEFAULT 10,
    ADD COLUMN topics VARCHAR(100) NULL AFTER era;

-- 2. Extend 'events' table
ALTER TABLE events 
    ADD COLUMN associated_era VARCHAR(100) NULL,
    ADD COLUMN location VARCHAR(255) NULL AFTER duration;

-- 3. User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id             BIGINT       NOT NULL,
    favorite_topics     JSON         NULL, -- e.g. ["Nature", "Mythology"]
    favorite_techniques JSON         NULL, -- e.g. ["Oil", "Sculpture"]
    favorite_eras       JSON         NULL, -- e.g. ["Impressionism", "Renaissance"]
    PRIMARY KEY (user_id),
    CONSTRAINT fk_user_pref_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 4. User Work Interactions table
CREATE TABLE IF NOT EXISTS user_work_interactions (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    user_id          BIGINT       NOT NULL,
    work_id          BIGINT       NOT NULL,
    interaction_type VARCHAR(50)  NOT NULL, -- 'VIEW', 'COMMENT'
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_uwi_user_id (user_id),
    KEY idx_uwi_work_id (work_id),
    CONSTRAINT fk_uwi_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_uwi_work FOREIGN KEY (work_id) REFERENCES works (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;