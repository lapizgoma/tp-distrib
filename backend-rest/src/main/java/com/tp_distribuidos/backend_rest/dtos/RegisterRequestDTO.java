package com.tp_distribuidos.backend_rest.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Datos necesarios para registrar un nuevo usuario en el sistema.
 *
 * <p>Se recibe el nombre, el apellido, el email y la contraseña por duplicado
 * ({@code password} y {@code confirmPassword}) como medida de seguridad para
 * evitar errores de tipeo. La coincidencia entre ambas contraseñas se valida
 * en la capa de servicio, ya que la confirmación no forma parte de la entidad
 * {@code User}.</p>
 *
 * @param firstName       nombre del usuario.
 * @param lastName        apellido del usuario.
 * @param email           correo electrónico, usado luego como nombre de usuario.
 * @param password        contraseña elegida.
 * @param confirmPassword repetición de la contraseña para confirmarla.
 */
public record RegisterRequestDTO(

        @NotBlank(message = "El nombre es obligatorio")
        String firstName,

        @NotBlank(message = "El apellido es obligatorio")
        String lastName,

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no tiene un formato válido")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
        String password,

        @NotBlank(message = "La confirmación de la contraseña es obligatoria")
        String confirmPassword
) {
}
