package com.shopping.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.shopping.model.*;
import com.shopping.repository.*;

import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private CartRepository cartRepo;

    @Autowired
    private CartItemRepository cartItemRepo;

    @Autowired
    private OrderRepository orderRepo;

    @Autowired
    private OrderItemRepository orderItemRepo;

    @Autowired
    private ProductRepository productRepo;

    public String placeOrder(Integer userId) {

        Cart cart = cartRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));

        List<CartItem> cartItems = cartItemRepo.findByCartId(cart.getId());

        if (cartItems.isEmpty()) {
            return "Cart is empty";
        }

        Order order = new Order();
        order.setUserId(userId);

        double total = 0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem ci : cartItems) {

            Product product = ci.getProduct();

            if (product.getStock() < ci.getQuantity()) {
                throw new RuntimeException("Not enough stock");
            }

            product.setStock(product.getStock() - ci.getQuantity());
            productRepo.save(product);

            total += product.getPrice() * ci.getQuantity();

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(product);
            oi.setQuantity(ci.getQuantity());
            oi.setPrice(product.getPrice());

            orderItems.add(oi);
        }

        order.setTotalAmount(total);
        order.setItems(orderItems);

        orderRepo.save(order);

        cartItemRepo.deleteAll(cartItems);

        return "Order placed successfully";
    }
}