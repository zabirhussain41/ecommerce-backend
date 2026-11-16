package com.shopping.controller;

import com.shopping.service.AdminAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    @Autowired private AdminAnalyticsService analyticsService;

    @GetMapping("/dashboard/summary")
    public Map<String, Object> summary() {
        return analyticsService.dashboardSummary();
    }

    @GetMapping("/analytics/sales")
    public List<Map<String, Object>> sales(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "day") String groupBy) {
        return analyticsService.salesSeries(from, to, groupBy);
    }

    @GetMapping("/analytics/customers")
    public Map<String, Object> customers(
            @RequestParam(defaultValue = "30") int days) {
        return analyticsService.customerAnalytics(days);
    }
}
