package com.shopping.service;

import com.shopping.dto.CustomerSummary;
import com.shopping.model.Order;
import com.shopping.model.User;
import com.shopping.repository.OrderRepository;
import com.shopping.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AdminCustomerService {

    /** Customers who spent at least this much (non-cancelled orders) are HIGH_VALUE. */
    public static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("500.00");
    private static final int RECENT_DAYS = 30;
    private static final int INACTIVE_DAYS = 90;

    @Autowired private UserRepository userRepository;
    @Autowired private OrderRepository orderRepository;

    public record CustomerStats(long orderCount, BigDecimal totalSpent, LocalDateTime lastOrderAt) {}

    /** Aggregated order stats per customer id: [userId, count, sum, maxCreatedAt]. */
    public Map<Integer, CustomerStats> customerStats() {
        Map<Integer, CustomerStats> map = new HashMap<>();
        for (Object[] row : orderRepository.customerOrderStats()) {
            Integer userId = (Integer) row[0];
            long count = (Long) row[1];
            BigDecimal sum = (BigDecimal) row[2];
            LocalDateTime last = (LocalDateTime) row[3];
            map.put(userId, new CustomerStats(count, sum, last));
        }
        return map;
    }

    /**
     * Segment definitions (a customer may qualify for several; this returns the primary label):
     *  HIGH_VALUE  – total non-cancelled spend >= $500
     *  REPEAT      – 2+ non-cancelled orders
     *  RECENT      – order placed within last 30 days
     *  NEW         – registered within last 30 days with no orders
     *  INACTIVE    – registered >90 days ago and no order in last 90 days
     *  NONE        – does not qualify for any segment
     */
    public String segmentFor(User user, CustomerStats stats, LocalDateTime now) {
        if (stats != null) {
            if (stats.totalSpent().compareTo(HIGH_VALUE_THRESHOLD) >= 0) return "HIGH_VALUE";
            if (stats.orderCount() >= 2) return "REPEAT";
            if (stats.lastOrderAt() != null
                    && ChronoUnit.DAYS.between(stats.lastOrderAt(), now) <= RECENT_DAYS)
                return "RECENT";
        }
        LocalDateTime createdAt = user.getCreatedAt() != null
                ? user.getCreatedAt() : LocalDateTime.of(2000, 1, 1, 0, 0);
        long accountAgeDays = ChronoUnit.DAYS.between(createdAt, now);
        boolean hasRecentOrder = stats != null && stats.lastOrderAt() != null
                && ChronoUnit.DAYS.between(stats.lastOrderAt(), now) <= RECENT_DAYS;
        if (accountAgeDays <= RECENT_DAYS && (stats == null || stats.orderCount() == 0))
            return "NEW";
        if (accountAgeDays > INACTIVE_DAYS && !hasRecentOrder)
            return "INACTIVE";
        return "NONE";
    }

    public Page<CustomerSummary> list(String search, Pageable pageable) {
        Page<User> users = (search == null || search.isBlank())
                ? userRepository.findByRoleOrderByCreatedAtDesc("USER", pageable)
                : userRepository.searchCustomers(search.trim(), pageable);

        Map<Integer, CustomerStats> stats = customerStats();
        LocalDateTime now = LocalDateTime.now();

        return users.map(u -> {
            CustomerStats s = stats.get(u.getId());
            return CustomerSummary.from(u,
                    s != null ? s.orderCount() : 0,
                    s != null ? s.totalSpent() : BigDecimal.ZERO,
                    s != null ? s.lastOrderAt() : null,
                    segmentFor(u, s, now));
        });
    }

    public CustomerSummary detail(Integer userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
        Map<Integer, CustomerStats> stats = customerStats();
        CustomerStats s = stats.get(userId);
        return CustomerSummary.from(user,
                s != null ? s.orderCount() : 0,
                s != null ? s.totalSpent() : BigDecimal.ZERO,
                s != null ? s.lastOrderAt() : null,
                segmentFor(user, s, LocalDateTime.now()));
    }

    public boolean isCustomer(Integer userId) {
        return userRepository.findById(userId)
            .map(u -> "USER".equals(u.getRole())).orElse(false);
    }
}
