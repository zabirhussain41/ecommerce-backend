# Ecommerce Backend — Spring Boot

REST API backend for an online shopping system.
Built with Java, Spring Boot, Hibernate, MySQL.

## Features
- User registration and JWT authentication
- Product listing with categories
- Shopping cart management
- Order placement and tracking

## Tech stack
Java 17 · Spring Boot 3 · Spring Security
Hibernate/JPA · MySQL · Maven

## API endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login, get token |
| GET | /api/products | List all products |
| POST | /api/cart/add | Add item to cart |
| POST | /api/orders | Place order |

## Run locally
```bash
git clone https://github.com/zabirhussain41/ecommerce-backend-springboot
cd ecommerce-backend-springboot
# Edit src/main/resources/application.properties
# Set your DB name, username, password
mvn spring-boot:run
```

## Live API
https://your-app.railway.app  ← add after deploy
