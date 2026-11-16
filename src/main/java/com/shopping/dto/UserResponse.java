package com.shopping.dto;

import com.shopping.model.User;
import java.time.LocalDateTime;

public record UserResponse(
        Integer id,
        String username,
        String email,
        String fullName,
        String phone,
        String role,
        LocalDateTime createdAt
) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getEmail(),
                u.getFullName(), u.getPhone(), u.getRole(), u.getCreatedAt());
    }
}
