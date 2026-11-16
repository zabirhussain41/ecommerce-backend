package com.shopping.service;

import com.shopping.dto.CartItemResponse;
import com.shopping.model.*;
import com.shopping.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    @Autowired private CartRepository cartRepo;
    @Autowired private CartItemRepository cartItemRepo;
    @Autowired private ProductRepository productRepo;

    private Cart getOrCreateCart(Integer userId) {
        return cartRepo.findByUserId(userId)
            .orElseGet(() -> {
                Cart c = new Cart();
                c.setUserId(userId);
                return cartRepo.save(c);
            });
    }

    private CartItem ownedItem(Integer userId, Integer itemId) {
        CartItem item = cartItemRepo.findById(itemId)
            .orElseThrow(() -> new RuntimeException("Cart item not found"));
        Cart cart = item.getCart();
        if (cart == null || !userId.equals(cart.getUserId()))
            throw new RuntimeException("Cart item not found");
        return item;
    }

    @Transactional
    public void addToCart(Integer userId, Integer productId, int qty) {
        if (qty < 1) throw new RuntimeException("Quantity must be at least 1");

        Cart cart = getOrCreateCart(userId);

        Product product = productRepo.findById(productId)
            .filter(Product::isActive)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        Optional<CartItem> existing = cartItemRepo
            .findByCartIdAndProductId(cart.getId(), productId);

        int resultingQty = existing.map(CartItem::getQuantity).orElse(0) + qty;
        if (product.getStock() < resultingQty)
            throw new RuntimeException("Insufficient stock for: " + product.getName());

        if (existing.isPresent()) {
            existing.get().setQuantity(resultingQty);
            cartItemRepo.save(existing.get());
        } else {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(qty);
            cartItemRepo.save(item);
        }
    }

    public List<CartItemResponse> viewCart(Integer userId) {
        Optional<Cart> cartOpt = cartRepo.findByUserId(userId);
        if (cartOpt.isEmpty()) return List.of();
        return cartItemRepo.findByCartId(cartOpt.get().getId()).stream()
            .map(CartItemResponse::from)
            .toList();
    }

    public BigDecimal cartTotal(Integer userId) {
        Cart cart = cartRepo.findByUserId(userId).orElse(null);
        if (cart == null) return BigDecimal.ZERO;
        return cartItemRepo.findByCartId(cart.getId()).stream()
            .map(CartItemResponse::from)
            .map(CartItemResponse::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional
    public CartItemResponse updateQuantity(Integer userId, Integer itemId, int quantity) {
        if (quantity < 1) throw new RuntimeException("Quantity must be at least 1");
        CartItem item = ownedItem(userId, itemId);
        Product product = item.getProduct();
        if (product.getStock() < quantity)
            throw new RuntimeException("Insufficient stock for: " + product.getName());
        item.setQuantity(quantity);
        return CartItemResponse.from(cartItemRepo.save(item));
    }

    @Transactional
    public void removeItem(Integer userId, Integer itemId) {
        cartItemRepo.delete(ownedItem(userId, itemId));
    }

    @Transactional
    public void clearCart(Integer userId) {
        Cart cart = cartRepo.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Cart not found"));
        cartItemRepo.deleteByCartId(cart.getId());
    }
}
