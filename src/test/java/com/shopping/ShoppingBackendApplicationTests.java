package com.shopping;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "jwt.secret=test-secret-key-that-is-long-enough-for-hs256-signing-0123456789",
    "admin.seed.password=AdminPass123",
    "spring.main.banner-mode=off"
})
class ShoppingBackendApplicationTests {

    @Test
    void contextLoads() {
    }
}
