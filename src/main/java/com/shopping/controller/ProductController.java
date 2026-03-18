package com.shopping.controller;

import com.shopping.model.Product;
import com.shopping.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired private ProductService productService;

    @GetMapping
    public Page<Product> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false)    Integer categoryId) {
        return productService.getAll(page, size, categoryId);
    }

    @GetMapping("/search")
    public Page<Product> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return productService.search(q, page, size);
    }

    @GetMapping("/{id}")
    public Product getById(@PathVariable int id) {
        return productService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> add(@RequestBody Product product) {
        if (product.getName() == null || product.getName().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Product name required"));
        if (product.getPrice() == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Price required"));
        return ResponseEntity.ok(productService.addProduct(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Product update(@PathVariable int id, @RequestBody Product product) {
        return productService.updateProduct(id, product);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable int id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(Map.of("message", "Product deleted"));
    }
}
