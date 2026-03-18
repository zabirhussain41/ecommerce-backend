package com.shopping.controller;

import com.shopping.model.*;
import com.shopping.repository.UserRepository;
import com.shopping.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired private CartService cartService;
    @Autowired private UserRepository userRepository;

    private Integer getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"))
            .getId();
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam int productId,
            @RequestParam(defaultValue = "1") int quantity) {
        cartService.addToCart(getUserId(userDetails), productId, quantity);
        return ResponseEntity.ok(Map.of("message", "Added to cart"));
    }

    @GetMapping
    public List<CartItem> viewCart(@AuthenticationPrincipal UserDetails userDetails) {
        return cartService.viewCart(getUserId(userDetails));
    }

    @DeleteMapping("/item/{itemId}")
    public ResponseEntity<?> removeItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer itemId) {
        cartService.removeItem(getUserId(userDetails), itemId);
        return ResponseEntity.ok(Map.of("message", "Item removed"));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(@AuthenticationPrincipal UserDetails userDetails) {
        cartService.clearCart(getUserId(userDetails));
        return ResponseEntity.ok(Map.of("message", "Cart cleared"));
    }
}
