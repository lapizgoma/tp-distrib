-- ============================================================
-- Museo Virtual - Datos por defecto
-- Usuarios iniciales para autenticación (Spring Security),
-- artistas y obras de ejemplo para desarrollo/demo.
--
-- Idempotente: se ejecuta en cada arranque
-- (spring.sql.init.mode=always). Los usuarios dependen del
-- UNIQUE de users.email; artistas y obras usan IDs fijos y
-- INSERT IGNORE sobre la clave primaria.
--
-- NOTA: si la base ya tiene artistas/obras creados por el CRUD
-- con esos IDs, el INSERT IGNORE los salteará. Para un seed
-- limpio conviene resetear el volumen: docker compose down -v
-- ============================================================

INSERT IGNORE INTO users (email, password, role, first_name, last_name) VALUES
    ('admin@museo.com',     '$2a$10$aC.44NUVhz8EwSgMwPmdIeIHiIx2bhRitCTIleqVXRdBEM7fLtPJy', 'ADMINISTRADOR', 'Admin',     'Sistema'),
    ('curador@museo.com',   '$2a$10$wyWKgq9/Jz9jOn3CmDyuu.fbirsX1KZGyP4ShWyFZV2Gr3ey4N9Re', 'CURADOR',       'Curador',   'Sistema'),
    ('visitante@museo.com', '$2a$10$BN/H9EYLP2SqfimEQRRtaOHw4bom6KVyi8Yv6txIidksgZXIrLi26', 'VISITANTE',     'Visitante', 'Sistema');

INSERT IGNORE INTO artists (id, name, biography) VALUES
    (1, 'Vincent van Gogh',  'Pintor neerlandés y una de las figuras más influyentes del postimpresionismo, conocido por su uso expresivo del color y sus pinceladas gestuales.'),
    (2, 'Claude Monet',      'Pintor francés, fundador del movimiento impresionista, célebre por sus series de nenúfares y paisajes capturados al aire libre.'),
    (3, 'Leonardo da Vinci', 'Polímata renacentista italiano: pintor, inventor, anatomista y arquitecto, símbolo del hombre del Renacimiento.'),
    (4, 'Frida Kahlo',       'Pintora mexicana que retrató su identidad, el dolor y la cultura popular con un estilo profundamente personal.'),
    (5, 'Pablo Picasso',     'Pintor y escultor español, cofundador del cubismo y uno de los artistas más prolíficos del siglo XX.'),
    (6, 'Gustav Klimt',      'Pintor austríaco y principal exponente del modernismo vienés, reconocido por sus retratos dorados y ornamentales.'),
    (7, 'Johannes Vermeer',  'Maestro neerlandés del Barroco, admirado por su dominio de la luz y las escenas íntimas de la vida cotidiana.'),
    (8, 'Salvador Dalí',     'Pintor español y figura central del surrealismo, famoso por sus imágenes oníricas y su personalidad excéntrica.');

INSERT IGNORE INTO works (id, title, artist_id, image_url, creation_year, technique, dimensions, era, description, location, availability) VALUES
    (1,  'La noche estrellada', 1, 'https://placehold.co/600x400?text=La+noche+estrellada', 1889, 'Óleo sobre lienzo', '73,7 x 92,1 cm', 'Posimpresionismo', 'Vista nocturna de un cielo ondulante sobre el pueblo de Saint-Rémy, pintada desde la ventana del sanatorio donde Van Gogh se encontraba internado; una de las obras más reconocidas del arte occidental.', 'Sala 4 - Arte Moderno', 'EN_EXHIBICION'),
    (2,  'Los girasoles', 1, 'https://placehold.co/600x400?text=Los+girasoles', 1888, 'Óleo sobre lienzo', '92,1 x 73 cm', 'Posimpresionismo', 'Serie de bodegones con girasoles que Van Gogh pintó en Arlés para decorar la habitación de Gauguin; el amarillo domina la composición con una intensidad casi lumínica.', 'Sala 4 - Arte Moderno', 'EN_EXHIBICION'),
    (3,  'El dormitorio en Arlés', 1, 'https://placehold.co/600x400?text=El+dormitorio+en+Arles', 1888, 'Óleo sobre lienzo', '72 x 90 cm', 'Posimpresionismo', 'Representación del dormitorio del artista en la Casa Amarilla, con perspectivas inclinadas y colores planos que transmiten una sensación de calma.', 'Depósito', 'EN_DEPOSITO'),
    (4,  'Impresión, sol naciente', 2, 'https://placehold.co/600x400?text=Impresion+sol+naciente', 1872, 'Óleo sobre lienzo', '48 x 63 cm', 'Impresionismo', 'Escena portuaria de Le Havre que dio nombre al movimiento impresionista; el sol naciente disuelve los contornos en pinceladas sueltas y luminosas.', 'Sala 2 - Impresionismo', 'EN_EXHIBICION'),
    (5,  'Nenúfares', 2, 'https://placehold.co/600x400?text=Nenufares', 1906, 'Óleo sobre lienzo', '89,9 x 94,1 cm', 'Impresionismo', 'Uno de los numerosos estudios que Monet realizó sobre el estanque de su jardín en Giverny, explorando los reflejos y la luz cambiante del agua.', 'Sala 2 - Impresionismo', 'EN_EXHIBICION'),
    (6,  'La Mona Lisa', 3, 'https://placehold.co/600x400?text=La+Mona+Lisa', 1503, 'Óleo sobre tabla de álamo', '77 x 53 cm', 'Renacimiento', 'Retrato de Lisa Gherardini, célebre por la técnica del sfumato y la enigmática sonrisa; probablemente la pintura más famosa del mundo.', 'Sala 1 - Grandes Maestros', 'EN_EXHIBICION'),
    (7,  'La última cena', 3, 'https://placehold.co/600x400?text=La+ultima+cena', 1498, 'Temple y óleo sobre yeso', '460 x 880 cm', 'Renacimiento', 'Mural que representa la anunciación de la traición de Judas durante la última cena de Jesús, pintado en el refectorio de Santa Maria delle Grazie en Milán.', 'Depósito', 'EN_DEPOSITO'),
    (8,  'Las dos Fridas', 4, 'https://placehold.co/600x400?text=Las+dos+Fridas', 1939, 'Óleo sobre lienzo', '173,5 x 173 cm', 'Surrealismo', 'Doble autorretrato pintado tras su divorcio de Diego Rivera, donde las dos Fridas comparten el corazón y simbolizan sus dos raíces, mexicana y europea.', 'Sala 5 - Arte Latinoamericano', 'EN_EXHIBICION'),
    (9,  'Autorretrato con collar de espinas', 4, 'https://placehold.co/600x400?text=Autorretrato+con+collar+de+espinas', 1940, 'Óleo sobre lienzo', '63,5 x 49,5 cm', 'Surrealismo', 'Autorretrato donde la artista se muestra con un collar de espinas, acompañada por un colibrí y un gato; alude al sufrimiento y a la superación.', 'Depósito', 'EN_DEPOSITO'),
    (10, 'Guernica', 5, 'https://placehold.co/600x400?text=Guernica', 1937, 'Óleo sobre lienzo', '349,3 x 776,6 cm', 'Cubismo', 'Monumental alegato contra la guerra inspirado en el bombardeo de la ciudad vasca de Guernica, con figuras desmembradas en blanco, negro y gris.', 'Sala 3 - Vanguardias', 'EN_EXHIBICION'),
    (11, 'El beso', 6, 'https://placehold.co/600x400?text=El+beso', 1908, 'Óleo y pan de oro sobre lienzo', '180 x 180 cm', 'Modernismo', 'Pareja abrazada cubierta por un manto dorado, obra cumbre del período dorado de Klimt y del modernismo vienés.', 'Sala 3 - Vanguardias', 'EN_EXHIBICION'),
    (12, 'La joven de la perla', 7, 'https://placehold.co/600x400?text=La+joven+de+la+perla', 1665, 'Óleo sobre lienzo', '44,5 x 39 cm', 'Barroco', 'Retrato de una joven con un turbante azul y una perla, conocido como la Mona Lisa del Norte por su mirada directa y su refinado tratamiento de la luz.', 'Sala 1 - Grandes Maestros', 'EN_EXHIBICION'),
    (13, 'La persistencia de la memoria', 8, 'https://placehold.co/600x400?text=La+persistencia+de+la+memoria', 1931, 'Óleo sobre lienzo', '24 x 33 cm', 'Surrealismo', 'Escena onírica de relojes derretidos sobre un paisaje costero, una de las imágenes más icónicas del surrealismo.', 'Sala 3 - Vanguardias', 'EN_EXHIBICION'),
    (14, 'Terraza de café por la noche', 1, 'https://placehold.co/600x400?text=Terraza+de+cafe+por+la+noche', 1888, 'Óleo sobre lienzo', '80,7 x 65,3 cm', 'Posimpresionismo', 'Vista nocturna de una terraza en Arlés con colores intensos y contrastados, donde Van Gogh prescindió deliberadamente del uso del negro.', 'Sala 4 - Arte Moderno', 'EN_EXHIBICION'),
    (15, 'El puente japonés', 2, 'https://placehold.co/600x400?text=El+puente+japones', 1899, 'Óleo sobre lienzo', '89,2 x 93,3 cm', 'Impresionismo', 'Escena del jardín acuático de Giverny con un puente de madera inspirado en los grabados japoneses que coleccionaba el artista.', 'Depósito', 'EN_DEPOSITO');
