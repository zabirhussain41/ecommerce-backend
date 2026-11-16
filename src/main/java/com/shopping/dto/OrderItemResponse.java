package com.shopping.dto;

import com.shopping.model.OrderItem;
import java.math.BigDecimal;

public record OrderItemResponse(
        Integer productId,
        String name,
        String imageUrl,
        Integer quantity,
        BigDecimal price,
        BigDecimal lineTotal
) {
    public static OrderItemResponse from(OrderItem item) {
        var p = item.getProduct();
        BigDecimal line = item.getPrice() != null
                ? item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity() != null ? item.getQuantity() : 0))
                : BigDecimal.ZERO;
        return new OrderItemResponse(
                p != null ? p.getId() : null,
                p != null ? p.getName() : "Unknown product",
                p != null ? p.getImageUrl() : null,
                item.getQuantity(),
                item.getPrice(),
                line);
    }
}
