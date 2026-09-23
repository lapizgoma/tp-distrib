package com.tp_distribuidos.backend_rest.dtos;

import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.security.SecurityUser;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "UserResponse", description = "Datos básicos del usuario autenticado.")
public record UserResponseDTO(

        @Schema(description = "Identificador único del usuario.", example = "1")
        Long id,

        @Schema(description = "Email del usuario.", example = "usuario@ejemplo.com")
        String email,

        @Schema(description = "Rol del usuario.", example = "VISITANTE")
        UserRole role,

        @Schema(description = "Nombre del usuario.", example = "Juan")
        String firstName,

        @Schema(description = "Apellido del usuario.", example = "Pérez")
        String lastName
) {

    /**
     * Construye la respuesta a partir del usuario autenticado, sin exponer la
     * contraseña.
     *
     * @param user usuario autenticado obtenido del token JWT.
     * @return los datos básicos del usuario listos para serializar.
     */
    public static UserResponseDTO from(SecurityUser user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getFirstName(),
                user.getLastName());
    }
}
