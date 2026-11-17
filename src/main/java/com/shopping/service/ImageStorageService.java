package com.shopping.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif");
    private static final long MAX_SIZE = 5L * 1024 * 1024; // 5 MB

    private final Path uploadDir;

    public ImageStorageService(@Value("${app.upload.dir:uploads}") String dir) {
        this.uploadDir = Paths.get(dir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create upload directory: " + this.uploadDir, e);
        }
    }

    /**
     * Saves an uploaded image and returns its public URL path (/uploads/xxx.ext).
     */
    public String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("Image file is required");
        if (file.getSize() > MAX_SIZE)
            throw new IllegalArgumentException("Image exceeds 5 MB limit");

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase()))
            throw new IllegalArgumentException("Unsupported image type: " + contentType);

        String ext = switch (contentType.toLowerCase()) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            case "image/svg+xml" -> ".svg";
            case "image/avif" -> ".avif";
            default -> ".bin";
        };

        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        Path target = uploadDir.resolve(filename);
        file.transferTo(target);
        return "/uploads/" + filename;
    }

    /** Deletes a previously stored file given its /uploads/... URL. */
    public void delete(String url) {
        if (url == null || !url.startsWith("/uploads/")) return;
        try {
            Files.deleteIfExists(uploadDir.resolve(url.substring("/uploads/".length())));
        } catch (IOException ignored) { }
    }
}
