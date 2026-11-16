package com.shopping.controller;

import com.shopping.dto.OrderResponse;
import com.shopping.model.Order;
import com.shopping.model.User;
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
            @RequestParam(defaultValue = "COD") String paymentMethod,
            @RequestParam(required = false) Integer addressId) {
        Order order = orderService.placeOrder(getUserId(userDetails), paymentMethod, addressId);
        return ResponseEntity.ok(Map.of(
            "message", "Order placed successfully",
            "orderId", order.getId(),
            "total", order.getTotalAmount(),
            "status", order.getStatus().name()
        ));
    }

    @GetMapping("/my")
    public List<OrderResponse> myOrders(@AuthenticationPrincipal UserDetails userDetails) {
        return orderService.getMyOrders(getUserId(userDetails));
    }

    @GetMapping("/{id}")
    public OrderResponse orderDetail(@AuthenticationPrincipal UserDetails userDetails,
                                     @PathVariable Integer id) {
        return orderService.getMyOrder(getUserId(userDetails), id);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id,
                                          @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }
}
