-- ============================================================
-- Museo Virtual - Datos por defecto
-- Usuarios iniciales para autenticacion (Spring Security).
-- Idempotente gracias al UNIQUE de users.email (INSERT IGNORE).
-- ============================================================

INSERT IGNORE INTO users (email, password, role, first_name, last_name) VALUES
    ('admin@museo.com',     '$2a$10$aC.44NUVhz8EwSgMwPmdIeIHiIx2bhRitCTIleqVXRdBEM7fLtPJy', 'ADMINISTRADOR', 'Admin',     'Sistema'),
    ('curador@museo.com',   '$2a$10$wyWKgq9/Jz9jOn3CmDyuu.fbirsX1KZGyP4ShWyFZV2Gr3ey4N9Re', 'CURADOR',       'Curador',   'Sistema'),
    ('visitante@museo.com', '$2a$10$BN/H9EYLP2SqfimEQRRtaOHw4bom6KVyi8Yv6txIidksgZXIrLi26', 'VISITANTE',     'Visitante', 'Sistema');