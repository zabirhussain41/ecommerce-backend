package com.shopping.service;

import com.shopping.model.Product;
import com.shopping.model.ProductImage;
import com.shopping.repository.ProductImageRepository;
import com.shopping.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class ProductImageService {

    @Autowired private ProductImageRepository imageRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ImageStorageService storageService;

    @Transactional
    public ProductImage upload(Integer productId, MultipartFile file, boolean primary) throws IOException {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        String url = storageService.store(file);

        List<ProductImage> existing = imageRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);
        ProductImage img = new ProductImage();
        img.setProduct(product);
        img.setUrl(url);
        img.setSortOrder(existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getSortOrder() + 1);
        img.setPrimaryImage(existing.isEmpty() || primary);
        imageRepository.save(img);

        // demote other primaries if this one is primary
        if (img.isPrimaryImage()) {
            for (ProductImage other : existing) {
                if (other.isPrimaryImage()) {
                    other.setPrimaryImage(false);
                    imageRepository.save(other);
                }
            }
            product.setImageUrl(url); // keep legacy single-image field in sync
            productRepository.save(product);
        }
        return img;
    }

    @Transactional
    public void delete(Integer productId, Integer imageId) {
        ProductImage img = imageRepository.findById(imageId)
            .orElseThrow(() -> new RuntimeException("Image not found: " + imageId));
        if (img.getProduct() == null || !img.getProduct().getId().equals(productId))
            throw new RuntimeException("Image does not belong to product " + productId);

        boolean wasPrimary = img.isPrimaryImage();
        String url = img.getUrl();
        imageRepository.delete(img);
        storageService.delete(url);

        Product product = productRepository.findById(productId).orElse(null);
        if (product != null && wasPrimary) {
            List<ProductImage> remaining = imageRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);
            if (!remaining.isEmpty()) {
                ProductImage next = remaining.get(0);
                next.setPrimaryImage(true);
                imageRepository.save(next);
                product.setImageUrl(next.getUrl());
            } else {
                product.setImageUrl(null);
            }
            productRepository.save(product);
        }
    }

    @Transactional
    public ProductImage setPrimary(Integer productId, Integer imageId) {
        ProductImage img = imageRepository.findById(imageId)
            .orElseThrow(() -> new RuntimeException("Image not found: " + imageId));
        if (img.getProduct() == null || !img.getProduct().getId().equals(productId))
            throw new RuntimeException("Image does not belong to product " + productId);

        for (ProductImage other : imageRepository.findByProductIdOrderBySortOrderAscIdAsc(productId)) {
            boolean shouldBe = other.getId().equals(imageId);
            if (other.isPrimaryImage() != shouldBe) {
                other.setPrimaryImage(shouldBe);
                imageRepository.save(other);
            }
        }
        Product product = productRepository.findById(productId).orElseThrow();
        product.setImageUrl(img.getUrl());
        productRepository.save(product);
        return img;
    }

    @Transactional
    public List<ProductImage> reorder(Integer productId, List<Integer> orderedIds) {
        List<ProductImage> images = imageRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);
        for (int i = 0; i < orderedIds.size(); i++) {
            final int order = i;
            final Integer id = orderedIds.get(i);
            images.stream().filter(im -> im.getId().equals(id)).findFirst().ifPresent(im -> {
                im.setSortOrder(order);
                imageRepository.save(im);
            });
        }
        return imageRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);
    }
}
