# Backend Audit — ecommerce-backend

Audit of `https://github.com/zabirhussain41/ecommerce-backend` (cloned at commit `6baa5ed`, branch `main`).

## 1. Architecture

Single-module Maven project (`com.shopping:shopping-backend:1.0.0`), `war` packaging (runs fine via `spring-boot:run`).

- **Spring Boot 3.2.5**, Java 17 target, Spring Security + jjwt 0.11.5, Spring Data JPA, MySQL (`mysql-connector-j`), Lombok (declared, unused).
- **No tests** — `src/test` does not exist. `target/` build output and Eclipse metadata are committed to the repo.
- `spring.jpa.hibernate.ddl-auto=update` — schema is auto-managed; no Flyway/Liquibase.
- Layering: `controller` → `service` → `repository` → `model`. **No DTO layer exists** — entities are serialized directly to JSON.
- Config: `application.properties` only. DB URL/JWT secret env-overridable; DB username/password and the effective JWT secret are **hardcoded** (see §9).

## 2. Endpoint inventory

| Method | Path | Purpose | Request | Response | Auth | Role | Status |
|---|---|---|---|---|---|---|---|
| POST | `/api/auth/register` | Register user | `User` entity `{username,email?,password,role?,...}` | `{message}` or `{error}` | public | — | **insecure** — accepts `role` from client (privilege escalation); no email uniqueness check |
| POST | `/api/auth/login` | Login, issue JWT | `{username,password}` | `{token,username,role}` or 401 `{error}` | public | — | existing |
| GET | `/test` | Health check | — | `"APP IS RUNNING"` | public | — | existing |
| GET | `/api/products` | Paged product list | params `page,size,categoryId` | `Page<Product>` | public | — | existing — no price/sort filters |
| GET | `/api/products/search` | Search products | `q,page,size` | `Page<Product>` | public | — | existing — name/description LIKE |
| GET | `/api/products/{id}` | Product detail | — | `Product` | public | — | existing |
| POST | `/api/products` | Create product | `Product` entity | `Product` | JWT | ADMIN | existing — minimal validation |
| PUT | `/api/products/{id}` | Update product | `Product` entity | `Product` | JWT | ADMIN | existing — cannot change category |
| DELETE | `/api/products/{id}` | Soft-delete product | — | `{message}` | JWT | ADMIN | existing |
| GET | `/api/cart` | View cart | — | `List<CartItem>` entities | JWT | user | **buggy** — `CartItem.cart` back-reference risks JSON recursion / LazyInitializationException |
| POST | `/api/cart/add` | Add to cart | params `productId,quantity` | `{message}` | JWT | user | existing — stock check ignores already-queued qty |
| DELETE | `/api/cart/item/{itemId}` | Remove item | — | `{message}` | JWT | user | **IDOR** — no ownership check |
| DELETE | `/api/cart/clear` | Clear cart | — | `{message}` | JWT | user | existing |
| POST | `/api/orders/place` | Place order (COD) | param `paymentMethod` (default `COD`) | `{message,orderId,total,status}` | JWT | user | existing — **no shipping address captured** |
| GET | `/api/orders/my` | My orders | — | `List<Order>` entities | JWT | user | existing — raw entities, no detail endpoint |
| PUT | `/api/orders/{id}/status` | Update status | params `id`,`status` | `Order` | JWT | ADMIN | existing — **no state-transition rules**; invalid status → 400 |
| GET | `/api/categories/**` | — | — | — | public (permitted) | — | **MISSING** — permitted in SecurityConfig but no controller exists |

## 3. Authentication & authorization

- Stateless JWT bearer tokens. `JwtFilter` runs before `UsernamePasswordAuthenticationFilter`, loads `UserDetails` via `CustomUserDetailsService` (roles from `User.role`, default `"USER"`).
- `SecurityConfig`: CSRF disabled; CORS `allowedOriginPatterns("*")` + `allowCredentials(true)` (**insecure**); permits `/api/auth/**`, `GET /api/products/**`, `GET /api/categories/**`, `/test`; everything else authenticated. `@EnableMethodSecurity` + `@PreAuthorize("hasRole('ADMIN')")` on admin product/order endpoints.
- `JwtUtil`: **hardcoded secret** `"mysupersecretkey..."` — the `jwt.secret`/`jwt.expiration` properties are dead config. Token expiry hardcoded 1h. jjwt 0.11.5 `parserBuilder` API.
- `JwtFilter` defects: skip-prefix checks `/auth` but real paths are `/api/auth` (harmless dead code); **does not catch `JwtException`** — expired/malformed tokens throw → 500 instead of 401.
- No refresh tokens, no `/me`, no logout endpoint (client discards token), no password change, no email verification.
- `GlobalExceptionHandler`: `RuntimeException` → 404 if message contains "not found" else 400; `AccessDeniedException` → 403; everything else → 500 generic. No bean-validation or data-integrity handlers.

## 4. Data model

- `User` — id, username (unique), email (unique, nullable), password (BCrypt), role (`USER`/`ADMIN` string), createdAt. **No name/phone/address fields.**
- `Product` — id, name, description(TEXT), price, originalPrice, stock, imageUrl, badge, `@ManyToOne` Category (EAGER), active (soft delete), createdAt.
- `Category` — id, name (unique), slug, imageUrl.
- `Cart` — id, userId (plain Integer, no FK), `@OneToMany` CartItem.
- `CartItem` — id, `@ManyToOne` Cart, `@ManyToOne` Product, quantity.
- `Order` — id, userId (plain Integer), totalAmount, status enum `PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED`, paymentMethod, `@OneToMany` OrderItem, createdAt/updatedAt. **No address/customer snapshot.**
- `OrderItem` — id, `@ManyToOne` Order, `@ManyToOne` Product, quantity, price (snapshot at purchase — good).

Relationships are loose (`userId` as Integer on Cart/Order rather than `@ManyToOne` to User) — acceptable; preserve.

## 5. Features already implemented

Auth register/login (JWT), product browse/search/detail + admin CRUD, per-user cart (add/view/remove/clear), COD order placement with server-side stock decrement and total calculation, customer order history, admin order status update.

## 6. Missing for the storefront

Categories listing; auth `/me`, profile update, change password; cart quantity update + totals DTO; order detail; shipping addresses; product price-range/sort filters; guest cart (will use "login required" strategy — documented).

## 7. Missing for the Admin CRM

Everything: dashboard summary/analytics, paginated customer list + detail + order history, sales/customers analytics, CRM interactions (notes/calls/emails), follow-up tasks, admin order list/detail with filters, admin product list incl. inactive, category management, admin seed account, CSV export (optional), reviews/wishlist/coupons (out of scope unless trivial).

## 8. Required backend modifications

See `docs/missing-backend-features.md`. Summary: DTO layer for auth/cart/order responses; security fixes (JWT secret/expiry config, token exception handling, register role lockdown, cart ownership, CORS origins); new `Address`, `CustomerInteraction`, `CrmTask` entities; admin controllers for dashboard/customers/orders; categories controller; order status transition rules; admin data seeder; tests (none exist).

## 9. Security & integration risks

1. **Privilege escalation** — register accepts `role` from request body. Fix: DTO + force `USER`.
2. **Hardcoded JWT secret** committed to repo; property ignored. Fix: `@Value` injection, env-only secret, fail-fast if default used in prod.
3. **Token errors → 500**. Fix: catch `JwtException` in filter → 401.
4. **Cart IDOR** on `removeItem`. Fix: verify `item.cart.userId == caller`.
5. **CORS `*` + credentials**. Fix: explicit origin list from config.
6. **Entity serialization** — `CartItem.cart` ↔ `Cart.items` recursion risk; `User` never returned (good); Order/CartItem expose internals. Fix: response DTOs.
7. **DB creds `ROOT/ROOT`** in committed properties. Fix: env vars + `.env.example`; never commit real secrets.
8. **No order state machine** — admin can jump any status. Fix: transition whitelist.
9. **No admin exists** — no seed. Fix: `ApplicationRunner` seeder from env credentials.
10. `stock` check on add-to-cart ignores quantity already in cart.
11. `IllegalArgumentException` from `OrderStatus.valueOf` handled as 400 — acceptable but will add explicit validation.
12. Java 25 runtime vs Spring Boot 3.2.5 (built for ≤21) — compile/run risk; see implementation notes.
