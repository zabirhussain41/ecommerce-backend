package com.shopping.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @Size(max = 50) String label,
        @Size(max = 100) String fullName,
        @Size(max = 30) String phone,

        @NotBlank(message = "Address line 1 is required")
        @Size(max = 200) String addressLine1,

        @Size(max = 200) String addressLine2,
        @Size(max = 100) String city,
        @Size(max = 100) String state,
        @Size(max = 20) String postalCode,
        @Size(max = 100) String country,
        Boolean defaultAddress
) {}
