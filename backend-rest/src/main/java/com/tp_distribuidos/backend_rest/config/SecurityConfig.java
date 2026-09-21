package com.tp_distribuidos.backend_rest.config;

import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import com.tp_distribuidos.backend_rest.security.UserDetailsServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuración de seguridad HTTP del backend REST.
 *
 * <p>La aplicación es stateless y está pensada para autenticación basada en
 * JWT. Por ahora el único endpoint de autenticación implementado es el registro,
 * que es público; el resto de las rutas se dejan abiertas temporalmente hasta
 * que exista el login y el filtro que valide el token.</p>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Define la cadena de filtros de seguridad.
     *
     * <p>Reglas actuales:
     * <ul>
     *     <li>CSRF deshabilitado, al ser una API stateless.</li>
     *     <li>Sin sesiones ({@link SessionCreationPolicy#STATELESS}).</li>
     *     <li>{@code POST /api/rest/auth/register} público para cualquiera.</li>
     *     <li>El resto de las rutas queda abierto provisoriamente.</li>
     * </ul>
     * </p>
     *
     * TODO: cuando se implemente el login, agregar aquí el
     *       {@code JwtAuthenticationFilter} y cambiar el resto de las rutas a
     *       {@code .anyRequest().authenticated()}. El filtro debería:
     *         1. leer el header {@code Authorization: Bearer <token>},
     *         2. validar el token con {@code JwtService#parseToken},
     *         3. cargar el usuario y setear el
     *            {@code SecurityContextHolder}.
     *       Registro previsto:
     *         {@code http.addFilterBefore(jwtAuthenticationFilter,
     *         UsernamePasswordAuthenticationFilter.class);}
     *
     * @param http configuración de seguridad a construir.
     * @return la cadena de filtros configurada.
     * @throws Exception si la configuración de seguridad falla.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/rest/auth/register").permitAll()
                        // TODO: reemplazar por .anyRequest().authenticated() junto con el filtro JWT.
                        .anyRequest().permitAll());
        return http.build();
    }

    /**
     * Define el encoder de contraseñas, basado en BCrypt.
     *
     * @return el {@link PasswordEncoder} usado para hashear y verificar claves.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Registra el servicio que carga usuarios desde la base de datos.
     *
     * @param userRepository repositorio de usuarios.
     * @return la implementación de {@link UserDetailsService}.
     */
    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return new UserDetailsServiceImpl(userRepository);
    }

    /**
     * Configura el proveedor de autenticación que valida email y contraseña
     * contra la base de datos usando BCrypt.
     *
     * @param userDetailsService servicio de carga de usuarios.
     * @param passwordEncoder    encoder de contraseñas.
     * @return el proveedor de autenticación configurado.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }
}
