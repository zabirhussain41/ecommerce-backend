package com.shopping.repository;

import com.shopping.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {
    List<ProductImage> findByProductIdOrderBySortOrderAscIdAsc(Integer productId);
    void deleteByProductId(Integer productId);
}
