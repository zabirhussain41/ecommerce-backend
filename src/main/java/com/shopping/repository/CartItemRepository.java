package com.shopping.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.shopping.model.CartItem;

import java.util.List;

public interface CartItemRepository extends JpaRepository<CartItem, Integer> {
	List<CartItem> findByCartId(Integer cartId);
}