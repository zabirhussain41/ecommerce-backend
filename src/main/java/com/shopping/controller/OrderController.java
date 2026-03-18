package com.shopping.controller;

import com.shopping.model.Order;
import com.shopping.repository.UserRepository;
import com.shopping.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired private OrderService orderService;
    @Autowired private UserRepository userRepository;

    private Integer getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
            .orElseThrow().getId();
    }

    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "COD") String paymentMethod) {
        Order order = orderService.placeOrder(getUserId(userDetails), paymentMethod);
        return ResponseEntity.ok(Map.of(
            "message", "Order placed successfully",
            "orderId", order.getId(),
            "total", order.getTotalAmount(),
            "status", order.getStatus()
        ));
    }

    @GetMapping("/my")
    public List<Order> myOrders(@AuthenticationPrincipal UserDetails userDetails) {
        return orderService.getMyOrders(getUserId(userDetails));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id,
                                          @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }
}
