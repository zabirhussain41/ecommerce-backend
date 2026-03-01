package com.shopping.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.shopping.model.Order;

public interface OrderRepository extends JpaRepository<Order, Integer> {
}