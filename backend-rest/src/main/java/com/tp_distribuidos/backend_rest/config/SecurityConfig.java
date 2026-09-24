package com.tp_distribuidos.backend_rest.config;

import com.tp_distribuidos.backend_rest.repositories.UserRepository;
import com.tp_distribuidos.backend_rest.security.JwtAuthenticationFilter;
import com.tp_distribuidos.backend_rest.security.RestAccessDeniedHandler;
import com.tp_distribuidos.backend_rest.security.RestAuthenticationEntryPoint;
import com.tp_distribuidos.backend_rest.security.UserDetailsServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;

/**
 * Configuración de seguridad HTTP del backend REST.
 *
 * <p>La aplicación es stateless y autentica mediante JWT: el login emite el
 * token y {@link JwtAuthenticationFilter} lo valida en cada petición. Registro,
 * login y documentación son públicos; el resto de las rutas requiere
 * autenticación. No se usa Redis ni sesiones: el usuario se resuelve contra la
 * base de datos en cada petición.</p>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    /**
     * Define la cadena de filtros de seguridad.
     *
     * <p>Reglas:
     * <ul>
     *     <li>CSRF deshabilitado, al ser una API stateless.</li>
     *     <li>Sin sesiones ({@link SessionCreationPolicy#STATELESS}).</li>
     *     <li>Públicos: {@code /api/rest/auth/register}, {@code /api/rest/auth/login},
     *     {@code /error} y las rutas de Swagger/OpenAPI.</li>
     *     <li>El resto de las rutas requiere autenticación.</li>
     *     <li>{@link JwtAuthenticationFilter} corre antes del filtro de login
     *     por usuario y contraseña.</li>
     *     <li>401 y 403 se serializan como {@code ProblemDetail}.</li>
     * </ul>
     * </p>
     *
     * @param http                      configuración de seguridad a construir.
     * @param jwtAuthenticationFilter   filtro que valida el token JWT.
     * @param restAuthenticationEntryPoint punto de entrada para no autenticados (401).
     * @param restAccessDeniedHandler   manejador para autenticados sin permiso (403).
     * @return la cadena de filtros configurada.
     * @throws Exception si la configuración de seguridad falla.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint restAuthenticationEntryPoint,
            RestAccessDeniedHandler restAccessDeniedHandler) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/rest/auth/register",
                                "/api/rest/auth/login",
                                "/error",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rest/works/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rest/events/**")
                        .permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /**
     * Expone el {@link AuthenticationManager} para autenticar credenciales en
     * el login, reutilizando el proveedor configurado en esta clase.
     *
     * @param configuration configuración de autenticación de Spring Security.
     * @return el gestor de autenticación.
     * @throws Exception si no se puede obtener el gestor.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
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
