package com.tp_distribuidos.backend_rest.security;

import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    private static final String EMAIL = "ana@museo.com";

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @Test
    void loadsUserWrappedInSecurityUserWhenEmailExists() {
        User user = User.of(EMAIL, "hashed", UserRole.CURADOR, "Ana", "Gomez");
        ReflectionTestUtils.setField(user, "id", 5L);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        UserDetails result = userDetailsService.loadUserByUsername(EMAIL);

        assertThat(result).isInstanceOf(SecurityUser.class);
        assertThat(result.getUsername()).isEqualTo(EMAIL);
        assertThat(result.getPassword()).isEqualTo("hashed");
        assertThat(result.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_CURADOR");
    }

    @Test
    void throwsUsernameNotFoundExceptionWhenEmailDoesNotExist() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername(EMAIL))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("User not found with email: " + EMAIL);
    }
}
