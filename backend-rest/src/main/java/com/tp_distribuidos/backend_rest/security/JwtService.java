package com.tp_distribuidos.backend_rest.security;

import com.tp_distribuidos.backend_rest.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

/**
 * Servicio emisor y verificador de JSON Web Tokens.
 *
 * <p>Implementa el rol de <em>Issuer</em> del backend REST usando firma
 * simétrica HMAC-SHA256. El registro de usuarios no emite tokens; este servicio
 * queda preparado para el futuro endpoint de login, que sí deberá generar el
 * token, y para cualquier verificación puntual dentro del servicio.</p>
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final JwtProperties properties;

    /**
     * Crea el servicio con la clave de firma y las propiedades de configuración.
     *
     * @param signingKey clave HMAC usada para firmar y verificar.
     * @param properties propiedades de JWT (issuer y expiración).
     */
    public JwtService(SecretKey signingKey, JwtProperties properties) {
        this.signingKey = signingKey;
        this.properties = properties;
    }

    /**
     * Genera un token firmado para el usuario autenticado.
     *
     * <p>Incluye como claims el identificador y el rol del usuario, además de
     * las fechas de emisión ({@code iat}) y expiración ({@code exp}) y el
     * emisor ({@code iss}) configurado.</p>
     *
     * @param user usuario autenticado.
     * @return el JWT compacto y firmado.
     */
    public String generateToken(SecurityUser user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getUsername())
                .issuer(properties.issuer())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(properties.expiration())))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Verifica la firma y vigencia de un token y devuelve sus claims.
     *
     * @param token JWT compacto.
     * @return los claims contenidos en el token.
     * @throws io.jsonwebtoken.JwtException si el token es inválido, fue
     *         manipulado o está expirado.
     */
    public Claims parseToken(String token) {
        Jws<Claims> jws = Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(properties.issuer())
                .build()
                .parseSignedClaims(token);
        return jws.getPayload();
    }
}
