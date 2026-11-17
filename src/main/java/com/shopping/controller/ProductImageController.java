package com.shopping.controller;

import com.shopping.model.ProductImage;
import com.shopping.service.ProductImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products/{productId}/images")
@PreAuthorize("hasRole('ADMIN')")
public class ProductImageController {

    @Autowired private ProductImageService imageService;

    @PostMapping
    public ResponseEntity<?> upload(
            @PathVariable Integer productId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean primary) {
        try {
            return ResponseEntity.ok(imageService.upload(productId, file, primary));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<?> delete(@PathVariable Integer productId, @PathVariable Integer imageId) {
        try {
            imageService.delete(productId, imageId);
            return ResponseEntity.ok(Map.of("message", "Image deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{imageId}/primary")
    public ResponseEntity<?> setPrimary(@PathVariable Integer productId, @PathVariable Integer imageId) {
        try {
            return ResponseEntity.ok(imageService.setPrimary(productId, imageId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/order")
    public ResponseEntity<?> reorder(@PathVariable Integer productId, @RequestBody List<Integer> orderedIds) {
        return ResponseEntity.ok(imageService.reorder(productId, orderedIds));
    }
}
