package com.tp_distribuidos.backend_rest.services;

import com.tp_distribuidos.backend_rest.dtos.RegisterRequestDTO;
import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.exceptions.EmailAlreadyExistsException;
import com.tp_distribuidos.backend_rest.exceptions.PasswordsDoNotMatchException;
import com.tp_distribuidos.backend_rest.models.entities.User;
import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Servicio con la lógica de negocio de autenticación y registro de usuarios.
 *
 * <p>Es el encargado de validar los datos recibidos, verificar que el email no
 * esté en uso, hashear la contraseña y persistir el nuevo usuario con el rol
 * por defecto {@link UserRole#VISITANTE}. No emite tokens: la emisión de JWT
 * quedará a cargo del futuro endpoint de login.</p>
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Crea el servicio con sus dependencias.
     *
     * @param userRepository  repositorio de usuarios.
     * @param passwordEncoder encoder usado para hashear las contraseñas.
     */
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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
}
