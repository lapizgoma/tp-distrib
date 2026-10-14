package com.tp_distribuidos.backend_rest.security;

import com.tp_distribuidos.backend_rest.enums.UserRole;
import com.tp_distribuidos.backend_rest.models.entities.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    private static final String EMAIL = "ana@museo.com";

    @Mock
    private JwtService jwtService;

    @Mock
    private UserDetailsService userDetailsService;

    private JwtAuthenticationFilter filter;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doesNotAuthenticateWhenAuthorizationHeaderIsMissing() throws Exception {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(any(), any());
        verifyNoInteractions(jwtService, userDetailsService);
    }

    @Test
    void doesNotAuthenticateWhenHeaderIsNotBearer() throws Exception {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Basic abc");
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtService, userDetailsService);
    }

    @Test
    void authenticatesRequestWhenTokenIsValid() throws Exception {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        SecurityUser userDetails = buildSecurityUser();
        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn(EMAIL);
        when(jwtService.parseToken("tok")).thenReturn(claims);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(userDetails);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer tok");
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isSameAs(userDetails);
        assertThat(authentication.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_CURADOR");
        verify(chain).doFilter(any(), any());
    }

    @Test
    void clearsContextAndContinuesWhenTokenIsInvalid() throws Exception {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken("previous", null));
        when(jwtService.parseToken("bad")).thenThrow(new MalformedJwtException("boom"));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer bad");
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(any(), any());
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void clearsContextAndContinuesWhenUserNoLongerExists() throws Exception {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn(EMAIL);
        when(jwtService.parseToken("tok")).thenReturn(claims);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenThrow(new UsernameNotFoundException("gone"));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer tok");
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(any(), any());
    }

    @Test
    void doesNotAuthenticateWhenSubjectIsNull() throws Exception {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        Claims claims = mock(Claims.class);
        when(jwtService.parseToken("tok")).thenReturn(claims);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer tok");
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(any(), any());
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void doesNotOverwriteExistingAuthentication() throws Exception {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        Authentication existing = new UsernamePasswordAuthenticationToken("previous", null, List.of());
        SecurityContextHolder.getContext().setAuthentication(existing);
        Claims claims = mock(Claims.class);
        when(jwtService.parseToken("tok")).thenReturn(claims);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer tok");
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isSameAs(existing);
        verify(chain).doFilter(any(), any());
        verify(userDetailsService, never()).loadUserByUsername(any());
    }

    private SecurityUser buildSecurityUser() {
        User user = User.of(EMAIL, "hashed", UserRole.CURADOR, "Ana", "Gomez");
        ReflectionTestUtils.setField(user, "id", 5L);
        return SecurityUser.of(user);
    }
}
