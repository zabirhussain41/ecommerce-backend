package com.shopping;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.model.*;
import com.shopping.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:authdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "jwt.secret=test-secret-key-that-is-long-enough-for-hs256-signing-0123456789",
    "admin.seed.password=AdminPass123",
    "spring.main.banner-mode=off"
})
@AutoConfigureMockMvc
class AuthFlowTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired UserRepository users;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;

    private String registerAndLogin(String username, String password) throws Exception {
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(java.util.Map.of(
                    "username", username, "password", password, "email", username + "@test.com"))))
            .andExpect(status().isOk());

        MvcResult res = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(java.util.Map.of(
                    "username", username, "password", password))))
            .andExpect(status().isOk())
            .andReturn();
        JsonNode body = om.readTree(res.getResponse().getContentAsString());
        return body.get("token").asText();
    }

    @Test
    void registerRejectsClientSuppliedAdminRole() throws Exception {
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"sneaky\",\"password\":\"password123\",\"role\":\"ADMIN\"}"))
            .andExpect(status().isOk());

        User u = users.findByUsername("sneaky").orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("USER", u.getRole());
    }

    @Test
    void registerValidatesInput() throws Exception {
        // short password
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"ab\",\"password\":\"short\"}"))
            .andExpect(status().isBadRequest());
        // duplicate username
        registerAndLogin("dupuser", "password123");
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"dupuser\",\"password\":\"password123\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void loginRejectsBadCredentials() throws Exception {
        registerAndLogin("gooduser", "password123");
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"gooduser\",\"password\":\"wrongpass\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void meRequiresValidToken() throws Exception {
        String token = registerAndLogin("meuser", "password123");

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("meuser"));

        // garbage token -> 401, not 500
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer garbage"))
            .andExpect(status().isUnauthorized());

        // no token -> 401
        mvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void customerCannotAccessAdminEndpoints() throws Exception {
        String token = registerAndLogin("regular", "password123");
        mvc.perform(get("/api/admin/customers").header("Authorization", "Bearer " + token))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/dashboard/summary").header("Authorization", "Bearer " + token))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminCanAccessAdminEndpoints() throws Exception {
        // DataInitializer seeds admin/admin creds from admin.seed.password
        MvcResult res = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\",\"password\":\"AdminPass123\"}"))
            .andExpect(status().isOk())
            .andReturn();
        String token = om.readTree(res.getResponse().getContentAsString()).get("token").asText();

        mvc.perform(get("/api/admin/customers").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
        mvc.perform(get("/api/admin/dashboard/summary").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCustomers").exists());
        mvc.perform(get("/api/admin/crm/tasks").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }

    @Test
    void cartAndOrderFlow() throws Exception {
        String token = registerAndLogin("shopper", "password123");

        // seed a product
        Category cat = new Category();
        cat.setName("TestCat");
        cat.setSlug("testcat");
        cat = categories.save(cat);
        Product p = new Product();
        p.setName("Widget");
        p.setPrice(new java.math.BigDecimal("19.99"));
        p.setStock(10);
        p.setCategory(cat);
        p = products.save(p);

        // add to cart (twice -> merged qty 3)
        mvc.perform(post("/api/cart/add?productId=" + p.getId() + "&quantity=2")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
        mvc.perform(post("/api/cart/add?productId=" + p.getId() + "&quantity=1")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());

        mvc.perform(get("/api/cart").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].quantity").value(3))
            .andExpect(jsonPath("$[0].lineTotal").value(59.97));

        // place order
        MvcResult res = mvc.perform(post("/api/orders/place?paymentMethod=COD")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
        int orderId = om.readTree(res.getResponse().getContentAsString()).get("orderId").asInt();

        // stock decremented
        org.junit.jupiter.api.Assertions.assertEquals(7, products.findById(p.getId()).orElseThrow().getStock());

        // order visible in /my
        mvc.perform(get("/api/orders/my").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(orderId));

        // another user cannot see it
        String other = registerAndLogin("other", "password123");
        mvc.perform(get("/api/orders/" + orderId).header("Authorization", "Bearer " + other))
            .andExpect(status().isNotFound());
    }

    @Test
    void orderStatusTransitionsEnforced() throws Exception {
        // login as seeded admin
        MvcResult res = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\",\"password\":\"AdminPass123\"}"))
            .andExpect(status().isOk()).andReturn();
        String adminToken = om.readTree(res.getResponse().getContentAsString()).get("token").asText();

        Category cat = new Category();
        cat.setName("C2"); cat.setSlug("c2");
        cat = categories.save(cat);
        Product p = new Product();
        p.setName("Gadget"); p.setPrice(new java.math.BigDecimal("10")); p.setStock(5); p.setCategory(cat);
        p = products.save(p);

        String userToken = registerAndLogin("orduser2", "password123");
        mvc.perform(post("/api/cart/add?productId=" + p.getId() + "&quantity=1")
                .header("Authorization", "Bearer " + userToken)).andExpect(status().isOk());
        MvcResult ordRes = mvc.perform(post("/api/orders/place")
                .header("Authorization", "Bearer " + userToken)).andExpect(status().isOk()).andReturn();
        int orderId = om.readTree(ordRes.getResponse().getContentAsString()).get("orderId").asInt();

        // invalid transition: PENDING -> DELIVERED should fail
        mvc.perform(put("/api/orders/" + orderId + "/status?status=DELIVERED")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isBadRequest());

        // valid: PENDING -> CONFIRMED
        mvc.perform(put("/api/orders/" + orderId + "/status?status=CONFIRMED")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());
    }
}
