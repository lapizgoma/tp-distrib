package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.LoginRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.LoginResponseDTO;
import com.tp_distribuidos.backend_rest.dtos.RegisterRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.UserResponseDTO;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.exceptions.ApiException;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import com.tp_distribuidos.backend_rest.security.JwtService;
import com.tp_distribuidos.backend_rest.security.SecurityUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String EMAIL = "ana@museo.com";
    private static final String RAW_PASSWORD = "secreto123";
    private static final Long USER_ID = 5L;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerNormalizesEmailTrimsNamesAndSavesVisitorUser() {
        RegisterRequestDTO request = new RegisterRequestDTO(
                "  Ana  ", "Gomez", "  Ana@Museo.COM  ", RAW_PASSWORD, RAW_PASSWORD);
        when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn("hashed");

        authService.register(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo(EMAIL);
        assertThat(saved.getPassword()).isEqualTo("hashed");
        assertThat(saved.getRole()).isEqualTo(UserRole.VISITANTE);
        assertThat(saved.getFirstName()).isEqualTo("Ana");
        assertThat(saved.getLastName()).isEqualTo("Gomez");
    }

    @Test
    void registerThrowsConflictAndDoesNotEncodeOrSaveWhenEmailAlreadyExists() {
        RegisterRequestDTO request = new RegisterRequestDTO("Ana", "Gomez", EMAIL, RAW_PASSWORD, RAW_PASSWORD);
        when(userRepository.existsByEmail(EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(ex.getMessage()).isEqualTo("Ya existe un usuario registrado con el email: " + EMAIL);
                });
        verifyNoInteractions(passwordEncoder);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerThrowsBadRequestAndDoesNotSaveWhenPasswordsDoNotMatch() {
        RegisterRequestDTO request = new RegisterRequestDTO("Ana", "Gomez", EMAIL, RAW_PASSWORD, "otra12345");
        when(userRepository.existsByEmail(EMAIL)).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("La contraseña y su confirmación no coinciden");
                });
        verifyNoInteractions(passwordEncoder);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerChecksEmailExistenceBeforePasswordMatch() {
        RegisterRequestDTO request = new RegisterRequestDTO("Ana", "Gomez", EMAIL, RAW_PASSWORD, "otra12345");
        when(userRepository.existsByEmail(EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(ex.getMessage()).isEqualTo("Ya existe un usuario registrado con el email: " + EMAIL);
                });
    }

    @Test
    void loginNormalizesEmailAndReturnsBearerToken() {
        SecurityUser securityUser = buildSecurityUser();
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                securityUser, null, securityUser.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtService.generateToken(securityUser)).thenReturn("jwt-token");
        when(jwtService.getExpirationSeconds()).thenReturn(3600L);

        LoginResponseDTO result = authService.login(new LoginRequestDTO("  Ana@Museo.COM  ", RAW_PASSWORD));

        assertThat(result.accessToken()).isEqualTo("jwt-token");
        assertThat(result.tokenType()).isEqualTo("Bearer");
        assertThat(result.expiresIn()).isEqualTo(3600L);

        ArgumentCaptor<Authentication> captor = ArgumentCaptor.forClass(Authentication.class);
        verify(authenticationManager).authenticate(captor.capture());
        assertThat(((UsernamePasswordAuthenticationToken) captor.getValue()).getPrincipal()).isEqualTo(EMAIL);
    }

    @Test
    void loginPropagatesAuthenticationExceptionAndDoesNotGenerateToken() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad credentials"));

        assertThatThrownBy(() -> authService.login(new LoginRequestDTO(EMAIL, RAW_PASSWORD)))
                .isInstanceOf(BadCredentialsException.class);
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void getCurrentUserMapsSecurityUserToResponse() {
        SecurityUser securityUser = buildSecurityUser();

        UserResponseDTO result = authService.getCurrentUser(securityUser);

        assertThat(result.id()).isEqualTo(USER_ID);
        assertThat(result.email()).isEqualTo(EMAIL);
        assertThat(result.role()).isEqualTo(UserRole.CURADOR);
        assertThat(result.firstName()).isEqualTo("Ana");
        assertThat(result.lastName()).isEqualTo("Gomez");
    }

    private SecurityUser buildSecurityUser() {
        User user = User.of(EMAIL, "hashed", UserRole.CURADOR, "Ana", "Gomez");
        ReflectionTestUtils.setField(user, "id", USER_ID);
        return SecurityUser.of(user);
    }
}
