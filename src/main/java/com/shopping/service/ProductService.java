package com.shopping.service;

import com.shopping.model.Product;
import com.shopping.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ProductService {

    @Autowired private ProductRepository repository;

    public Page<Product> getAll(int page, int size, Integer categoryId,
                                BigDecimal minPrice, BigDecimal maxPrice, String sort) {
        Sort sorting = switch (sort == null ? "newest" : sort) {
            case "price_asc"  -> Sort.by("price").ascending();
            case "price_desc" -> Sort.by("price").descending();
            default           -> Sort.by("createdAt").descending();
        };
        Pageable pageable = PageRequest.of(page, size, sorting);
        return repository.filter(categoryId, minPrice, maxPrice, pageable);
    }

    public Page<Product> search(String query, int page, int size, Integer categoryId,
                                BigDecimal minPrice, BigDecimal maxPrice, String sort) {
        Sort sorting = switch (sort == null ? "newest" : sort) {
            case "price_asc"  -> Sort.by("price").ascending();
            case "price_desc" -> Sort.by("price").descending();
            default           -> Sort.by("createdAt").descending();
        };
        return repository.search(query, categoryId, minPrice, maxPrice,
            PageRequest.of(page, size, sorting));
    }

    public Product getById(int id) {
        return repository.findById(id)
            .filter(Product::isActive)
            .orElseThrow(() -> new RuntimeException("Product not found: " + id));
    }

    public Page<Product> adminList(String q, Integer categoryId, Boolean active,
                                   int page, int size) {
        return repository.searchAdmin(
            (q == null || q.isBlank()) ? null : q,
            categoryId, active,
            PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public Product addProduct(Product product) {
        product.setId(null);
        return repository.save(product);
    }

    public Product updateProduct(int id, Product updated) {
        Product p = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found: " + id));
        p.setName(updated.getName());
        p.setDescription(updated.getDescription());
        p.setPrice(updated.getPrice());
        p.setOriginalPrice(updated.getOriginalPrice());
        p.setStock(updated.getStock());
        p.setImageUrl(updated.getImageUrl());
        p.setBadge(updated.getBadge());
        p.setActive(updated.isActive());
        if (updated.getCategory() != null && updated.getCategory().getId() != null) {
            p.setCategory(updated.getCategory());
        }
        return repository.save(p);
    }

    public void deleteProduct(int id) {
        Product p = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found: " + id));
        p.setActive(false);  // soft delete
        repository.save(p);
    }
}
