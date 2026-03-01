package com.shopping.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.shopping.model.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
	
}