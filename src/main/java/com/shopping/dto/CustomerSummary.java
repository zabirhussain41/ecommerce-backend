package com.shopping.dto;

import com.shopping.model.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerSummary(
        Integer id,
        String username,
        String email,
        String fullName,
        String phone,
        LocalDateTime createdAt,
        long orderCount,
        BigDecimal totalSpent,
        LocalDateTime lastOrderAt,
        String segment
) {
    public static CustomerSummary from(User u, long orderCount, BigDecimal totalSpent,
                                       LocalDateTime lastOrderAt, String segment) {
        return new CustomerSummary(u.getId(), u.getUsername(), u.getEmail(),
                u.getFullName(), u.getPhone(), u.getCreatedAt(),
                orderCount, totalSpent, lastOrderAt, segment);
    }
}
