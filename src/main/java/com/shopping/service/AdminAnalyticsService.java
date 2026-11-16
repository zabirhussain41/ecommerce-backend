package com.shopping.service;

import com.shopping.dto.CustomerSummary;
import com.shopping.dto.OrderResponse;
import com.shopping.model.CrmTask;
import com.shopping.model.Order;
import com.shopping.model.User;
import com.shopping.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AdminAnalyticsService {

    @Autowired private UserRepository userRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private CrmTaskRepository crmTaskRepository;
    @Autowired private AdminCustomerService adminCustomerService;

    public Map<String, Object> dashboardSummary() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since30 = now.minusDays(30);

        long totalCustomers = userRepository.countByRole("USER");
        long totalOrders = orderRepository.count();
        BigDecimal revenue = nullToZero(orderRepository.sumRevenueAll());
        BigDecimal revenue30 = nullToZero(orderRepository.sumRevenueSince(since30));
        long orders30 = orderRepository.countByCreatedAtAfter(since30);
        long newCustomers30 = userRepository.countByRoleAndCreatedAtAfter("USER", since30);

        BigDecimal aov = totalOrders > 0
                ? revenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<OrderResponse> recentOrders = orderRepository.findRecent(PageRequest.of(0, 8))
                .stream().map(OrderResponse::from).toList();

        Map<Integer, AdminCustomerService.CustomerStats> stats =
                adminCustomerService.customerStats();
        LocalDateTime finalNow = now;
        List<CustomerSummary> recentCustomers = userRepository
                .findByRoleOrderByCreatedAtDesc("USER", PageRequest.of(0, 8))
                .map(u -> {
                    var s = stats.get(u.getId());
                    return CustomerSummary.from(u,
                            s != null ? s.orderCount() : 0,
                            s != null ? s.totalSpent() : BigDecimal.ZERO,
                            s != null ? s.lastOrderAt() : null,
                            adminCustomerService.segmentFor(u, s, finalNow));
                }).toList();

        List<Map<String, Object>> topProducts = new ArrayList<>();
        for (Object[] row : orderItemRepository.topProducts(PageRequest.of(0, 5))) {
            topProducts.add(Map.of(
                    "productId", row[0],
                    "name", row[1],
                    "quantity", ((Number) row[2]).longValue(),
                    "revenue", row[3]));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalCustomers", totalCustomers);
        result.put("totalOrders", totalOrders);
        result.put("totalRevenue", revenue);
        result.put("avgOrderValue", aov);
        result.put("newCustomers30d", newCustomers30);
        result.put("revenue30d", revenue30);
        result.put("orders30d", orders30);
        result.put("ordersByStatus", orderStatusCounts());
        result.put("overdueTasks", crmTaskRepository.countByStatusAndDueDateBefore(
                CrmTask.TaskStatus.PENDING, LocalDate.now()));
        result.put("recentOrders", recentOrders);
        result.put("recentCustomers", recentCustomers);
        result.put("topProducts", topProducts);
        return result;
    }

    public List<Map<String, Object>> salesSeries(LocalDate from, LocalDate to, String groupBy) {
        if (from == null) from = LocalDate.now().minusDays(30);
        if (to == null) to = LocalDate.now();
        if (to.isBefore(from)) throw new RuntimeException("'to' date must be after 'from' date");
        if (ChronoUnit.DAYS.between(from, to) > 366)
            throw new RuntimeException("Date range cannot exceed 366 days");

        String mode = switch (groupBy == null ? "day" : groupBy) {
            case "week", "month" -> groupBy;
            default -> "day";
        };

        Map<String, double[]> buckets = new TreeMap<>(); // periodKey -> [revenue, orders]
        for (Object[] row : orderRepository.salesProjection(
                from.atStartOfDay(), to.plusDays(1).atStartOfDay())) {
            LocalDateTime created = (LocalDateTime) row[3];
            String key = periodKey(created.toLocalDate(), mode);
            double[] acc = buckets.computeIfAbsent(key, k -> new double[2]);
            acc[0] += ((BigDecimal) row[1]).doubleValue();
            acc[1] += 1;
        }

        List<Map<String, Object>> series = new ArrayList<>();
        for (var e : buckets.entrySet()) {
            series.add(Map.of(
                    "period", e.getKey(),
                    "label", e.getKey(),
                    "revenue", Math.round(e.getValue()[0] * 100.0) / 100.0,
                    "orderCount", (long) e.getValue()[1]));
        }
        return series;
    }

    public Map<String, Object> customerAnalytics(int days) {
        if (days <= 0 || days > 365) days = 30;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusDays(days);

        // registrations per day
        Map<LocalDate, Long> regByDay = new TreeMap<>();
        for (User u : userRepository.findAll()) {
            if ("USER".equals(u.getRole()) && u.getCreatedAt() != null
                    && u.getCreatedAt().isAfter(since)) {
                regByDay.merge(u.getCreatedAt().toLocalDate(), 1L, Long::sum);
            }
        }
        List<Map<String, Object>> registrations = new ArrayList<>();
        for (var e : regByDay.entrySet())
            registrations.add(Map.of("date", e.getKey().toString(), "count", e.getValue()));

        // segment counts (primary segment per customer)
        Map<Integer, AdminCustomerService.CustomerStats> stats =
                adminCustomerService.customerStats();
        Map<String, Long> segments = new LinkedHashMap<>();
        segments.put("HIGH_VALUE", 0L);
        segments.put("REPEAT", 0L);
        segments.put("RECENT", 0L);
        segments.put("NEW", 0L);
        segments.put("INACTIVE", 0L);
        segments.put("NONE", 0L);

        long customersWithOrders = 0;
        for (User u : userRepository.findAll()) {
            if (!"USER".equals(u.getRole())) continue;
            var s = stats.get(u.getId());
            if (s != null) customersWithOrders++;
            String seg = adminCustomerService.segmentFor(u, s, now);
            segments.merge(seg, 1L, Long::sum);
        }

        // repeat purchase rate: customers with >=2 orders / customers with >=1 order
        long repeatCustomers = stats.values().stream().filter(s -> s.orderCount() >= 2).count();
        double repeatRate = customersWithOrders > 0
                ? Math.round(repeatCustomers * 10000.0 / customersWithOrders) / 100.0 : 0.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("days", days);
        result.put("registrations", registrations);
        result.put("segments", segments);
        result.put("repeatPurchaseRate", repeatRate);
        result.put("customersWithOrders", customersWithOrders);
        return result;
    }

    private Map<String, Long> orderStatusCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Order.OrderStatus s : Order.OrderStatus.values())
            counts.put(s.name(), orderRepository.countByStatus(s));
        return counts;
    }

    private String periodKey(LocalDate date, String mode) {
        return switch (mode) {
            case "week" -> date.with(java.time.DayOfWeek.MONDAY).toString();
            case "month" -> date.withDayOfMonth(1).toString();
            default -> date.toString();
        };
    }

    private BigDecimal nullToZero(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
