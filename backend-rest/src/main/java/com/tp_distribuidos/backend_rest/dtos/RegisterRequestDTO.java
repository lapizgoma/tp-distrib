package com.tp_distribuidos.backend_rest.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "RegisterRequest", description = "Datos necesarios para registrar un nuevo usuario.")
public record RegisterRequestDTO(

        @Schema(description = "Nombre del usuario.", example = "Juan",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "El nombre es obligatorio")
        String firstName,

        @Schema(description = "Apellido del usuario.", example = "Pérez",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "El apellido es obligatorio")
        String lastName,

        @Schema(description = "Correo electrónico, usado luego como nombre de usuario.", example = "juan.perez@museo.com",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no tiene un formato válido")
        String email,

        @Schema(description = "Contraseña elegida. Mínimo 8 caracteres.", example = "secreto123",
                minLength = 8, accessMode = Schema.AccessMode.WRITE_ONLY,
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
        String password,

        @Schema(description = "Repetición de la contraseña para confirmarla. Debe coincidir con 'password'.",
                example = "secreto123", accessMode = Schema.AccessMode.WRITE_ONLY,
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "La confirmación de la contraseña es obligatoria")
        String confirmPassword
) {
}
