package com.shopping.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.shopping.model.Product;
import com.shopping.repository.ProductRepository;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository repository;

    public Product addProduct(Product product) {
        return repository.save(product);
    }

    public List<Product> getAll() {
        return repository.findAll();
    }

    public Product getById(int id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public Product updateProduct(int id, Product updated) {
        Product product = getById(id);
        product.setName(updated.getName());
        product.setPrice(updated.getPrice());
        product.setStock(updated.getStock());
        return repository.save(product);
    }

    public void deleteProduct(int id) {
        repository.deleteById(id);
    }
}