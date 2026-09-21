package com.tp_distribuidos.backend_rest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.convert.DurationUnit;

import java.time.Duration;
import java.time.temporal.ChronoUnit;

/**
 * Propiedades de configuración del emisor de JWT (Issuer).
 *
 * <p>Se enlazan desde el prefijo {@code app.security.jwt} del archivo de
 * configuración:</p>
 *
 * <pre>
 * app:
 *   security:
 *     jwt:
 *       secret: ...
 *       issuer: museo-virtual
 *       expiration: 3600
 * </pre>
 *
 * @param secret     clave secreta compartida usada para firmar con HMAC-SHA256.
 *                   Debe tener al menos 32 bytes (256 bits).
 * @param issuer     identificador emitido en el claim {@code iss}.
 * @param expiration tiempo de vida del token, expresado en segundos.
 */
@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(
        String secret,
        String issuer,
        @DurationUnit(ChronoUnit.SECONDS) Duration expiration
) {
}
