package com.tp_distribuidos.backend_rest.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro que autentica cada petición a partir del token JWT.
 *
 * <p>Lee el header {@code Authorization: Bearer <token>}, valida la firma con
 * {@link JwtService} y, si el token es correcto, carga el usuario desde la base
 * de datos con {@link UserDetailsService} y lo coloca en el
 * {@code SecurityContextHolder}.</p>
 *
 * <p><strong>Nota sobre el estado:</strong> no se utiliza Redis ni ningún
 * almacén de sesiones o listas de revocación. Por simplicidad en el TP, todo el
 * estado vive en la base de datos: la validez del token se apoya en su firma y
 * expiración, y el usuario se resuelve contra la tabla {@code users} en cada
 * petición. Un token robado seguiría siendo válido hasta su expiración, ya que
 * no hay revocación.</p>
 *
 * <p>Si el token falta, es inválido o el usuario ya no existe, el filtro no
 * autentica y deja continuar la cadena; la autorización responderá {@code 401}
 * cuando la ruta lo requiera.</p>
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    /**
     * Crea el filtro con sus dependencias.
     *
     * @param jwtService         servicio que valida y parsea los tokens.
     * @param userDetailsService servicio que carga el usuario desde la base.
     */
    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Intenta autenticar la petición a partir del token JWT y continúa la
     * cadena de filtros en todos los casos.
     *
     * @param request     petición HTTP entrante.
     * @param response    respuesta HTTP.
     * @param filterChain cadena de filtros a continuar.
     * @throws ServletException si ocurre un error de servlet.
     * @throws IOException      si ocurre un error de entrada/salida.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader(AUTHORIZATION_HEADER);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(BEARER_PREFIX.length());

        try {
            Claims claims = jwtService.parseToken(token);
            String email = claims.getSubject();

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (JwtException | IllegalArgumentException | UsernameNotFoundException ex) {
            // Token inválido o usuario inexistente: se continúa sin autenticar.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
