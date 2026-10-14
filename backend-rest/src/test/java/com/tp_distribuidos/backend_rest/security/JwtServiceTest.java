package com.tp_distribuidos.backend_rest.security;

import com.tp_distribuidos.backend_rest.config.JwtProperties;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.models.entities.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "dev-only-secret-key-change-me-please-0123456789";
    private static final String OTHER_SECRET = "another-secret-key-that-is-long-enough-1234567890";
    private static final String ISSUER = "museo-virtual";

    @Test
    void generatedTokenCarriesSubjectIssuerAndCustomClaims() {
        JwtService jwtService = jwtService(ISSUER, Duration.ofHours(1));

        String token = jwtService.generateToken(sampleUser());
        Claims claims = jwtService.parseToken(token);

        assertThat(claims.getSubject()).isEqualTo("ana@museo.com");
        assertThat(claims.getIssuer()).isEqualTo(ISSUER);
        assertThat(((Number) claims.get("userId")).longValue()).isEqualTo(5L);
        assertThat(claims.get("role", String.class)).isEqualTo("CURADOR");
        assertThat(claims.getExpiration()).isAfter(new Date());
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService jwtService = jwtService(ISSUER, Duration.ofSeconds(-10));
        String token = jwtService.generateToken(sampleUser());

        assertThatThrownBy(() -> jwtService.parseToken(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        JwtService issuer = jwtService(ISSUER, Duration.ofHours(1));
        SecretKey otherKey = Keys.hmacShaKeyFor(OTHER_SECRET.getBytes(StandardCharsets.UTF_8));
        JwtService verifier = new JwtService(otherKey, new JwtProperties(SECRET, ISSUER, Duration.ofHours(1)));
        String token = issuer.generateToken(sampleUser());

        assertThatThrownBy(() -> verifier.parseToken(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void tokenWithDifferentIssuerIsRejected() {
        String token = jwtService("issuer-a", Duration.ofHours(1)).generateToken(sampleUser());

        assertThatThrownBy(() -> jwtService("issuer-b", Duration.ofHours(1)).parseToken(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void malformedTokenIsRejected() {
        JwtService jwtService = jwtService(ISSUER, Duration.ofHours(1));

        assertThatThrownBy(() -> jwtService.parseToken("not-a-jwt"))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void getExpirationSecondsReturnsConfiguredSeconds() {
        JwtService jwtService = jwtService(ISSUER, Duration.ofMinutes(30));

        assertThat(jwtService.getExpirationSeconds()).isEqualTo(1800L);
    }

    private JwtService jwtService(String issuer, Duration expiration) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return new JwtService(key, new JwtProperties(SECRET, issuer, expiration));
    }

    private SecurityUser sampleUser() {
        User user = User.of("ana@museo.com", "hashed", UserRole.CURADOR, "Ana", "Gomez");
        ReflectionTestUtils.setField(user, "id", 5L);
        return SecurityUser.of(user);
    }
}
