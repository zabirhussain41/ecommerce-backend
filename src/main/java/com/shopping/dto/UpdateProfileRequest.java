package com.shopping.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Email(message = "Invalid email address")
        String email,

        @Size(max = 100)
        String fullName,

        @Size(max = 30)
        String phone
) {}
