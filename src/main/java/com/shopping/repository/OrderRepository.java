package com.shopping.repository;

import com.shopping.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Integer userId);
    Page<Order> findByUserId(Integer userId, Pageable pageable);
    long countByUserId(Integer userId);
    long countByStatus(Order.OrderStatus status);
    long countByCreatedAtAfter(LocalDateTime date);
    long countByStatusAndCreatedAtAfter(Order.OrderStatus status, LocalDateTime date);

    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:from IS NULL OR o.createdAt >= :from) AND " +
           "(:to IS NULL OR o.createdAt <= :to) AND " +
           "(:orderId IS NULL OR o.id = :orderId) AND " +
           "(:userIds IS NULL OR o.userId IN :userIds)")
    Page<Order> searchAdmin(@Param("status") Order.OrderStatus status,
                            @Param("from") LocalDateTime from,
                            @Param("to") LocalDateTime to,
                            @Param("orderId") Integer orderId,
                            @Param("userIds") Collection<Integer> userIds,
                            Pageable pageable);

    @Query("SELECT COALESCE(SUM(o.totalAmount),0) FROM Order o WHERE o.status <> 'CANCELLED'")
    java.math.BigDecimal sumRevenueAll();

    @Query("SELECT COALESCE(SUM(o.totalAmount),0) FROM Order o WHERE o.status <> 'CANCELLED' AND o.createdAt >= :from")
    java.math.BigDecimal sumRevenueSince(@Param("from") LocalDateTime from);

    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findRecent(Pageable pageable);

    @Query("SELECT o.id, o.totalAmount, o.status, o.createdAt FROM Order o " +
           "WHERE o.createdAt >= :from AND o.createdAt <= :to AND o.status <> 'CANCELLED'")
    List<Object[]> salesProjection(@Param("from") LocalDateTime from,
                                   @Param("to") LocalDateTime to);

    // Returns rows: [userId, orderCount, totalSpend, lastOrderAt] for non-cancelled orders
    @Query("SELECT o.userId, COUNT(o), COALESCE(SUM(o.totalAmount),0), MAX(o.createdAt) " +
           "FROM Order o WHERE o.status <> 'CANCELLED' GROUP BY o.userId")
    List<Object[]> customerOrderStats();
}
