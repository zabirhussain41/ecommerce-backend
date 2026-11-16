package com.shopping.config;

import com.shopping.model.User;
import com.shopping.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.seed.username:admin}")
    private String adminUsername;

    @Value("${admin.seed.password:}")
    private String adminPassword;

    @Value("${admin.seed.email:admin@example.com}")
    private String adminEmail;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.findFirstByRole("ADMIN").isPresent()) return;

        String password = adminPassword;
        if (password == null || password.isBlank()) {
            password = "Admin@" + java.util.UUID.randomUUID().toString().substring(0, 8);
            log.warn("No ADMIN_PASSWORD configured — generated admin password for '{}': {} "
                    + "(set ADMIN_PASSWORD env var to choose your own; change it after first login)",
                    adminUsername, password);
        }

        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setFullName("Administrator");
        admin.setRole("ADMIN");
        userRepository.save(admin);
        log.info("Seeded admin user '{}'", adminUsername);
    }
}
