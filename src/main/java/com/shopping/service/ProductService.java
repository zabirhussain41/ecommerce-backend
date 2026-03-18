package com.shopping.service;

import com.shopping.model.Product;
import com.shopping.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    @Autowired private ProductRepository repository;

    public Page<Product> getAll(int page, int size, Integer categoryId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (categoryId != null) return repository.findByCategoryIdAndActiveTrue(categoryId, pageable);
        return repository.findByActiveTrue(pageable);
    }

    public Page<Product> search(String query, int page, int size) {
        return repository.search(query, PageRequest.of(page, size));
    }

    public Product getById(int id) {
        return repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found: " + id));
    }

    public Product addProduct(Product product) { return repository.save(product); }

    public Product updateProduct(int id, Product updated) {
        Product p = getById(id);
        p.setName(updated.getName());
        p.setDescription(updated.getDescription());
        p.setPrice(updated.getPrice());
        p.setOriginalPrice(updated.getOriginalPrice());
        p.setStock(updated.getStock());
        p.setImageUrl(updated.getImageUrl());
        p.setBadge(updated.getBadge());
        return repository.save(p);
    }

    public void deleteProduct(int id) {
        Product p = getById(id);
        p.setActive(false);  // soft delete
        repository.save(p);
    }
}
