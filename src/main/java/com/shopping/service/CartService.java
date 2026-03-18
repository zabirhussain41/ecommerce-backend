package com.shopping.service;

import com.shopping.model.*;
import com.shopping.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    @Autowired private CartRepository cartRepo;
    @Autowired private CartItemRepository cartItemRepo;
    @Autowired private ProductRepository productRepo;

    public void addToCart(Integer userId, Integer productId, int qty) {
        Cart cart = cartRepo.findByUserId(userId)
            .orElseGet(() -> {
                Cart c = new Cart();
                c.setUserId(userId);
                return cartRepo.save(c);
            });

        Product product = productRepo.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getStock() < qty)
            throw new RuntimeException("Insufficient stock for: " + product.getName());

        // Merge if item already in cart
        Optional<CartItem> existing = cartItemRepo
            .findByCartIdAndProductId(cart.getId(), productId);

        if (existing.isPresent()) {
            existing.get().setQuantity(existing.get().getQuantity() + qty);
            cartItemRepo.save(existing.get());
        } else {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(qty);
            cartItemRepo.save(item);
        }
    }

    public List<CartItem> viewCart(Integer userId) {
        Cart cart = cartRepo.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Cart not found"));
        return cartItemRepo.findByCartId(cart.getId());
    }

    public void removeItem(Integer userId, Integer itemId) {
        CartItem item = cartItemRepo.findById(itemId)
            .orElseThrow(() -> new RuntimeException("Cart item not found"));
        cartItemRepo.delete(item);
    }

    public void clearCart(Integer userId) {
        Cart cart = cartRepo.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Cart not found"));
        cartItemRepo.deleteByCartId(cart.getId());
    }
}
