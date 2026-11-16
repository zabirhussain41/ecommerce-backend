package com.shopping.dto;

public record AuthResponse(
        String token,
        Integer id,
        String username,
        String email,
        String role
) {}
