package com.tp_distribuidos.backend_rest.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de OpenAPI/Swagger para el backend REST.
 *
 * <p>Define los metadatos generales de la API y el esquema de seguridad
 * {@code bearerAuth} (JWT), que queda disponible para documentar los endpoints
 * protegidos, como el futuro login. El esquema se declara de forma global pero
 * sin requerimiento de seguridad global, por lo que los endpoints públicos
 * (como el registro) no muestran candado.</p>
 */
@Configuration
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Token JWT emitido por el backend REST. Formato: 'Bearer {token}'."
)
public class OpenApiConfig {

    /**
     * Construye la definición principal de la API expuesta en Swagger UI.
     *
     * @return el objeto {@link OpenAPI} con la información general del servicio.
     */
    @Bean
    public OpenAPI museoVirtualOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Museo Virtual - REST API")
                        .version("v1")
                        .description("API REST del sistema Museo Virtual: autenticación, obras, artistas, "
                                + "eventos, comentarios e inscripciones.\n\n"
                                + "## Usuarios precargados (data.sql)\n\n"
                                + "| Rol | Email | Contraseña |\n"
                                + "| --- | --- | --- |\n"
                                + "| ADMINISTRADOR | admin@museo.com | `admin123` |\n"
                                + "| CURADOR | curador@museo.com | `curador123` |\n"
                                + "| VISITANTE | visitante@museo.com | `visitante123` |\n\n"
                                + "Para los endpoints protegidos, iniciá sesión en "
                                + "`POST /api/rest/auth/login` y enviá el token como `Bearer`.")
                        .contact(new Contact()
                                .name("Equipo Museo Virtual")
                                .email("equipo@museo.com")));
    }
}
