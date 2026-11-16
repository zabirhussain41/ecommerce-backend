package com.shopping.service;

import com.shopping.dto.OrderResponse;
import com.shopping.model.*;
import com.shopping.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class OrderService {

    private static final Map<Order.OrderStatus, Set<Order.OrderStatus>> TRANSITIONS = Map.of(
        Order.OrderStatus.PENDING,   Set.of(Order.OrderStatus.CONFIRMED, Order.OrderStatus.CANCELLED),
        Order.OrderStatus.CONFIRMED, Set.of(Order.OrderStatus.SHIPPED, Order.OrderStatus.CANCELLED),
        Order.OrderStatus.SHIPPED,   Set.of(Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED),
        Order.OrderStatus.DELIVERED, Set.of(),
        Order.OrderStatus.CANCELLED, Set.of()
    );

    @Autowired private CartRepository cartRepo;
    @Autowired private CartItemRepository cartItemRepo;
    @Autowired private OrderRepository orderRepo;
    @Autowired private ProductRepository productRepo;
    @Autowired private AddressRepository addressRepository;
    @Autowired private UserRepository userRepository;

    @Transactional
    public Order placeOrder(Integer userId, String paymentMethod, Integer addressId) {
        Cart cart = cartRepo.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Cart not found"));

        List<CartItem> cartItems = cartItemRepo.findByCartId(cart.getId());
        if (cartItems.isEmpty()) throw new RuntimeException("Cart is empty");

        for (CartItem ci : cartItems) {
            if (ci.getProduct().getStock() < ci.getQuantity())
                throw new RuntimeException("Not enough stock for: " + ci.getProduct().getName());
        }

        Order order = new Order();
        order.setUserId(userId);
        order.setPaymentMethod(paymentMethod != null ? paymentMethod : "COD");

        if (addressId != null) {
            Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new RuntimeException("Address not found"));
            order.setShippingAddress(ShippingAddress.from(address));
        }

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

    public List<OrderResponse> getMyOrders(Integer userId) {
        return orderRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(OrderResponse::from)
            .toList();
    }

    public OrderResponse getMyOrder(Integer userId, Integer orderId) {
        Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!userId.equals(order.getUserId()))
            throw new RuntimeException("Order not found");
        return OrderResponse.from(order);
    }

    @Transactional
    public Order updateStatus(Integer orderId, String status) {
        Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));

        Order.OrderStatus target;
        try {
            target = Order.OrderStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid order status: " + status);
        }

        Set<Order.OrderStatus> allowed = TRANSITIONS.getOrDefault(order.getStatus(), Set.of());
        if (!allowed.contains(target))
            throw new RuntimeException("Cannot transition order from "
                + order.getStatus() + " to " + target);

        order.setStatus(target);
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepo.save(order);
    }

    // ---------- Admin ----------

    public Page<Order> adminList(Order.OrderStatus status, LocalDateTime from,
                                 LocalDateTime to, String search, Pageable pageable) {
        List<Integer> userIds = null;
        Integer orderId = null;

        if (search != null && !search.isBlank()) {
            String q = search.trim();
            if (q.matches("\\d+")) {
                orderId = Integer.valueOf(q);
                // also match users with this id in case it's a user id search — keep order-id semantics
            }
            userIds = userRepository.searchCustomers(q, Pageable.unpaged())
                .map(User::getId).getContent();
            if (userIds.isEmpty()) userIds = null;
        }

        return orderRepo.searchAdmin(status, from, to, orderId, userIds, pageable);
    }

    public Order adminGet(Integer orderId) {
        return orderRepo.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public Map<String, Long> statusCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Order.OrderStatus s : Order.OrderStatus.values()) {
            counts.put(s.name(), orderRepo.countByStatus(s));
        }
        return counts;
    }
}
