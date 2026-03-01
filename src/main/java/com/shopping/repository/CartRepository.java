package com.shopping.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.shopping.model.Cart;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Integer> {
    Optional<Cart> findByUserId(Integer userId);
}