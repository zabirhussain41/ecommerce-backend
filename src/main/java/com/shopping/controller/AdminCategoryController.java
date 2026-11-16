package com.shopping.controller;

import com.shopping.model.Category;
import com.shopping.model.Product;
import com.shopping.repository.CategoryRepository;
import com.shopping.repository.ProductRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    public record CategoryRequest(
            @NotBlank(message = "Category name is required")
            @Size(max = 100) String name,
            @Size(max = 120) String slug,
            @Size(max = 500) String imageUrl
    ) {}

    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;

    @GetMapping
    public List<Category> list() {
        return categoryRepository.findAllByOrderByNameAsc();
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CategoryRequest req) {
        if (categoryRepository.findByNameIgnoreCase(req.name()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("error", "Category already exists"));
        Category c = new Category();
        c.setName(req.name());
        c.setSlug(req.slug() != null && !req.slug().isBlank() ? req.slug() : slugify(req.name()));
        c.setImageUrl(req.imageUrl());
        return ResponseEntity.ok(categoryRepository.save(c));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id,
                                    @Valid @RequestBody CategoryRequest req) {
        Category c = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found"));
        c.setName(req.name());
        if (req.slug() != null && !req.slug().isBlank()) c.setSlug(req.slug());
        c.setImageUrl(req.imageUrl());
        return ResponseEntity.ok(categoryRepository.save(c));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        Category c = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found"));
        if (productRepository.countByCategoryId(id) > 0)
            return ResponseEntity.status(409)
                .body(Map.of("error", "Category is used by products and cannot be deleted"));
        categoryRepository.delete(c);
        return ResponseEntity.ok(Map.of("message", "Category deleted"));
    }

    private String slugify(String name) {
        return name.toLowerCase().trim().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
