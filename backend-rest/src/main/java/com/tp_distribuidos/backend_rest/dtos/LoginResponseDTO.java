package com.tp_distribuidos.backend_rest.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LoginResponse", description = "Token de acceso emitido tras un login exitoso.")
public record LoginResponseDTO(

        @Schema(description = "Token JWT firmado que debe enviarse en el header Authorization.",
                example = "eyJhbGciOiJIUzI1NiJ9...")
        String accessToken,

        @Schema(description = "Tipo de token, siempre 'Bearer'.", example = "Bearer")
        String tokenType,

        @Schema(description = "Tiempo de vida del token en segundos.", example = "3600")
        long expiresIn
) {

    /**
     * Construye la respuesta fijando el tipo de token en {@code Bearer}.
     *
     * @param accessToken token JWT firmado.
     * @param expiresIn   tiempo de vida del token en segundos.
     * @return la respuesta de login lista para serializar.
     */
    public static LoginResponseDTO of(String accessToken, long expiresIn) {
        return new LoginResponseDTO(accessToken, "Bearer", expiresIn);
    }
}
