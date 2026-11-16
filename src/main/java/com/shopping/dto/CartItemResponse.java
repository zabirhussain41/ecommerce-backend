package com.shopping.dto;

import java.math.BigDecimal;

public record CartItemResponse(
        Integer id,
        Integer productId,
        String name,
        String imageUrl,
        BigDecimal price,
        int quantity,
        BigDecimal lineTotal,
        Integer stock
) {
    public static CartItemResponse from(com.shopping.model.CartItem item) {
        var p = item.getProduct();
        BigDecimal line = p.getPrice() != null
                ? p.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                : BigDecimal.ZERO;
        return new CartItemResponse(
                item.getId(),
                p.getId(),
                p.getName(),
                p.getImageUrl(),
                p.getPrice(),
                item.getQuantity(),
                line,
                p.getStock());
    }
}
