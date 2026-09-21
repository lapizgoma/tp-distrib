package com.tp_distribuidos.backend_rest.config;

import io.jsonwebtoken.security.Keys;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Configuración de los beans necesarios para firmar y verificar JWT.
 *
 * <p>El backend REST actúa como <em>Issuer</em>: firma los tokens con una clave
 * simétrica HMAC-SHA256. Los demás servicios del sistema distribuido deberán
 * verificar la firma usando la misma clave secreta compartida.</p>
 */
@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtConfig {

    /**
     * Construye la clave HMAC a partir del secreto configurado.
     *
     * @param properties propiedades de JWT enlazadas desde la configuración.
     * @return la clave simétrica usada para firmar y verificar tokens.
     * @throws io.jsonwebtoken.security.WeakKeyException si el secreto tiene
     *         menos de 256 bits.
     */
    @Bean
    public SecretKey jwtSecretKey(JwtProperties properties) {
        return Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
    }
}
