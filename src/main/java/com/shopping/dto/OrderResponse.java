package com.shopping.dto;

import com.shopping.model.Order;
import com.shopping.model.OrderItem;
import java.math.BigDecimal;
import java.util.List;

public record OrderResponse(
        Integer id,
        Integer userId,
        BigDecimal totalAmount,
        String status,
        String paymentMethod,
        com.shopping.model.ShippingAddress shippingAddress,
        List<OrderItemResponse> items,
        java.time.LocalDateTime createdAt,
        java.time.LocalDateTime updatedAt
) {
    public static OrderResponse from(Order order) {
        List<OrderItemResponse> items = order.getItems() == null ? List.of()
                : order.getItems().stream().map(OrderItemResponse::from).toList();
        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                order.getTotalAmount(),
                order.getStatus() != null ? order.getStatus().name() : null,
                order.getPaymentMethod(),
                order.getShippingAddress(),
                items,
                order.getCreatedAt(),
                order.getUpdatedAt());
    }
}
