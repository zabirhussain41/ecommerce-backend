package com.shopping.repository;

import com.shopping.model.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    // Returns rows: [productId, productName, totalQty, totalRevenue]
    @Query("SELECT oi.product.id, oi.product.name, SUM(oi.quantity), " +
           "SUM(oi.price * oi.quantity) FROM OrderItem oi " +
           "JOIN oi.order o WHERE o.status <> 'CANCELLED' " +
           "GROUP BY oi.product.id, oi.product.name " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> topProducts(Pageable pageable);
}
