package com.foodDelivery.restaurant_service.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth->auth
                        // Anyone can browse restaurants and menus (GET only)
                        .requestMatchers(HttpMethod.GET, "/api/v1/restaurants/nearby").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/restaurants/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/restaurants/top-rated").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/restaurants/{restaurantId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/restaurants/*/menu/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/restaurants/*/reviews").permitAll()
                        .requestMatchers("/actuator/**").permitAll()


                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
