package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.LoginRequestDTO;
import com.tp_distribuidos.backend_rest.dtos.LoginResponseDTO;
import com.tp_distribuidos.backend_rest.dtos.RegisterRequestDTO;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.exceptions.EmailAlreadyExistsException;
import com.tp_distribuidos.backend_rest.exceptions.PasswordsDoNotMatchException;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import com.tp_distribuidos.backend_rest.security.JwtService;
import com.tp_distribuidos.backend_rest.security.SecurityUser;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Servicio con la lógica de negocio de autenticación y registro de usuarios.
 *
 * <p>Es el encargado de registrar nuevos usuarios (validando email único,
 * contraseña confirmada y hasheada con BCrypt) y de autenticar credenciales
 * para emitir un token JWT al iniciar sesión.</p>
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    /**
     * Crea el servicio con sus dependencias.
     *
     * @param userRepository       repositorio de usuarios.
     * @param passwordEncoder      encoder usado para hashear las contraseñas.
     * @param authenticationManager manager que valida las credenciales.
     * @param jwtService           servicio emisor del token JWT.
     */
    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    /**
     * Registra un nuevo usuario con rol {@link UserRole#VISITANTE}.
     *
     * <p>Pasos:
     * <ol>
     *     <li>normaliza el email (recorta espacios y lo pasa a minúsculas);</li>
     *     <li>verifica que no exista otro usuario con ese email;</li>
     *     <li>verifica que la contraseña y su confirmación coincidan;</li>
     *     <li>hashea la contraseña y persiste al usuario.</li>
     * </ol>
     *
     * @param request datos del formulario de registro.
     * @throws EmailAlreadyExistsException  si el email ya está registrado.
     * @throws PasswordsDoNotMatchException si las contraseñas no coinciden.
     */
    @Transactional
    public void register(RegisterRequestDTO request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        if (!request.password().equals(request.confirmPassword())) {
            throw new PasswordsDoNotMatchException();
        }

        User user = User.of(
                email,
                passwordEncoder.encode(request.password()),
                UserRole.VISITANTE,
                request.firstName().trim(),
                request.lastName().trim());

        userRepository.save(user);
    }

    /**
     * Autentica las credenciales del usuario y emite un token JWT.
     *
     * <p>Delega la verificación en {@link AuthenticationManager}, que compara la
     * contraseña contra el hash almacenado en la base de datos. Si la
     * autenticación es exitosa, genera el token con {@link JwtService}.</p>
     *
     * @param request credenciales de inicio de sesión.
     * @return el token de acceso junto con su tipo y expiración.
     * @throws org.springframework.security.core.AuthenticationException si las
     *         credenciales son inválidas.
     */
    public LoginResponseDTO login(LoginRequestDTO request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));

        SecurityUser securityUser = (SecurityUser) authentication.getPrincipal();
        String accessToken = jwtService.generateToken(securityUser);

        return LoginResponseDTO.of(accessToken, jwtService.getExpirationSeconds());
    }
}
