package com.tp_distribuidos.backend_rest.security;

import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.models.entities.User;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityUserTest {

    private static final String EMAIL = "ana@museo.com";

    @Test
    void exposesAuthoritiesFromRole() {
        SecurityUser securityUser = buildSecurityUser(UserRole.ADMINISTRADOR);

        assertThat(securityUser.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_ADMINISTRADOR");
    }

    @Test
    void exposesUserData() {
        SecurityUser securityUser = buildSecurityUser(UserRole.CURADOR);

        assertThat(securityUser.getUsername()).isEqualTo(EMAIL);
        assertThat(securityUser.getPassword()).isEqualTo("hashed");
        assertThat(securityUser.getId()).isEqualTo(5L);
        assertThat(securityUser.getRole()).isEqualTo(UserRole.CURADOR);
        assertThat(securityUser.getFirstName()).isEqualTo("Ana");
        assertThat(securityUser.getLastName()).isEqualTo("Gomez");
    }

    @Test
    void accountIsAlwaysEnabledAndNotExpiredOrLocked() {
        SecurityUser securityUser = buildSecurityUser(UserRole.VISITANTE);

        assertThat(securityUser.isAccountNonExpired()).isTrue();
        assertThat(securityUser.isAccountNonLocked()).isTrue();
        assertThat(securityUser.isCredentialsNonExpired()).isTrue();
        assertThat(securityUser.isEnabled()).isTrue();
    }

    private SecurityUser buildSecurityUser(UserRole role) {
        User user = User.of(EMAIL, "hashed", role, "Ana", "Gomez");
        ReflectionTestUtils.setField(user, "id", 5L);
        return SecurityUser.of(user);
    }
}
