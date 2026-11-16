package com.shopping.controller;

import com.shopping.dto.OrderResponse;
import com.shopping.model.Order;
import com.shopping.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    @Autowired private OrderService orderService;

    @GetMapping
    public Page<OrderResponse> list(
            @RequestParam(required = false) Order.OrderStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        LocalDateTime fromDt = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDt = to != null ? to.plusDays(1).atStartOfDay() : null;

        return orderService.adminList(status, fromDt, toDt, search,
                PageRequest.of(page, size, Sort.by("createdAt").descending()))
            .map(OrderResponse::from);
    }

    @GetMapping("/{id}")
    public OrderResponse detail(@PathVariable Integer id) {
        return OrderResponse.from(orderService.adminGet(id));
    }
}
