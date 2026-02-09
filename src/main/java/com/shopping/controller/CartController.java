package com.shopping.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.shopping.model.CartItem;
import com.shopping.service.CartService;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @PostMapping("/add")
    public String addToCart(
    		@RequestParam(name = "productId") int productId,
            @RequestParam(name = "quantity") int quantity) {

        cartService.addToCart(1, productId, quantity);
        return "Item added to cart";
    }

    @GetMapping
    public List<CartItem> viewCart() {
        return cartService.viewCart(1);
    }
}
