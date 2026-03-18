package com.shopping.service;

import com.shopping.model.*;
import com.shopping.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    @Autowired private CartRepository cartRepo;
    @Autowired private CartItemRepository cartItemRepo;
    @Autowired private OrderRepository orderRepo;
    @Autowired private ProductRepository productRepo;

    @Transactional
    public Order placeOrder(Integer userId, String paymentMethod) {
        Cart cart = cartRepo.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Cart not found"));

        List<CartItem> cartItems = cartItemRepo.findByCartId(cart.getId());
        if (cartItems.isEmpty()) throw new RuntimeException("Cart is empty");

        // Validate all stock first
        for (CartItem ci : cartItems) {
            if (ci.getProduct().getStock() < ci.getQuantity())
                throw new RuntimeException("Not enough stock for: " + ci.getProduct().getName());
        }

        Order order = new Order();
        order.setUserId(userId);
        order.setPaymentMethod(paymentMethod);

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem ci : cartItems) {
            Product product = ci.getProduct();
            product.setStock(product.getStock() - ci.getQuantity());
            productRepo.save(product);

            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())));

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(product);
            oi.setQuantity(ci.getQuantity());
            oi.setPrice(product.getPrice());
            orderItems.add(oi);
        }

        order.setTotalAmount(total);
        order.setItems(orderItems);
        Order saved = orderRepo.save(order);

        cartItemRepo.deleteByCartId(cart.getId());
        return saved;
    }

    public List<Order> getMyOrders(Integer userId) {
        return orderRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Order updateStatus(Integer orderId, String status) {
        Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(Order.OrderStatus.valueOf(status.toUpperCase()));
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepo.save(order);
    }
}
