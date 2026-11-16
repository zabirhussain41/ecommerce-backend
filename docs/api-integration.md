# API Integration Contract

Base URL: `VITE_API_BASE_URL` (default `http://localhost:8080`). All paths below are relative to it. Auth = `Authorization: Bearer <jwt>` obtained from `POST /api/auth/login`. Errors return `{ "error": "message" }` (400/401/403/404/409/500).

## Auth — `/api/auth`

- `POST /register` — body `{username, email?, password, fullName?, phone?}` → 200 `{message}`; 400 `{error}` on duplicate username/email or weak password. `role` in body is ignored (always USER).
- `POST /login` — body `{username, password}` → 200 `{token, id, username, email, role}`; 401 `{error:"Invalid username or password"}`.
- `GET /me` — auth → `{id, username, email, fullName, phone, role, createdAt}`.
- `PUT /me` — auth — body `{email?, fullName?, phone?}` → `UserResponse`.
- `PUT /password` — auth — body `{currentPassword, newPassword}` → `{message}`; 400 on mismatch/weak.

## Products — `/api/products` (public GET)

- `GET /api/products?page&size&categoryId&minPrice&maxPrice&sort` — `sort` ∈ `newest|price_asc|price_desc` → `Page<Product>`.
- `GET /api/products/search?q&page&size` → `Page<Product>`.
- `GET /api/products/{id}` → `Product`.
- Admin: `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}` (soft), `GET /api/admin/products?page&size&q&categoryId&active`.

## Categories — `/api/categories`

- `GET /api/categories` public → `List<Category>`.
- Admin CRUD: `POST /api/admin/categories`, `PUT /api/admin/categories/{id}`, `DELETE /api/admin/categories/{id}` (hard delete only if unused — else 409).

## Cart — `/api/cart` (auth)

- `GET /api/cart` → `List<CartItemResponse>` `{id, productId, name, imageUrl, price, quantity, lineTotal, stock}`.
- `POST /api/cart/add?productId&quantity` → `{message}`; 400 on insufficient stock (existing + new qty validated).
- `PUT /api/cart/item/{itemId}?quantity` → `CartItemResponse`; 400 qty<1 or >stock.
- `DELETE /api/cart/item/{itemId}` → `{message}` (ownership enforced).
- `DELETE /api/cart/clear` → `{message}`.

## Addresses — `/api/addresses` (auth, owner-only)

- `GET` → `List<Address>`; `POST` body `{label?,fullName,phone,addressLine1,addressLine2?,city,state,postalCode,country,isDefault?}` → `Address`; `PUT /{id}`, `DELETE /{id}`.

## Orders — `/api/orders` (auth)

- `POST /place?paymentMethod=COD&addressId={id}` → `{message, orderId, total, status}`; 400 empty cart / stock / bad address.
- `GET /my` → `List<OrderResponse>` `{id,totalAmount,status,paymentMethod,createdAt,items:[{productId,name,quantity,price}],shippingAddress:{...}}`.
- `GET /{id}` → `OrderResponse` (owner only; 403 otherwise).
- Admin: `GET /api/admin/orders?page&size&status&from&to&search`; `GET /api/admin/orders/{id}`; `PUT /api/admin/orders/{id}/status?status=` — valid transitions only.

## Admin CRM — `/api/admin` (ROLE_ADMIN)

- `GET /dashboard/summary` → KPIs + `ordersByStatus` + `recentOrders` + `recentCustomers` + `topProducts`.
- `GET /analytics/sales?from&to&groupBy=day|week|month` → `[{period,label,revenue,orderCount}]`.
- `GET /analytics/customers?days=30` → `{registrations:[{date,count}],segments:{new,recent,repeat,highValue,inactive}}`.
- `GET /customers?page&size&search&sort` → `Page<CustomerSummary>` `{id,username,email,fullName,phone,createdAt,orderCount,totalSpent,lastOrderAt,segment}`.
- `GET /customers/{id}` → customer + stats; `GET /customers/{id}/orders?page&size`.
- `GET /customers/{id}/interactions` → timeline; `POST` `{type:NOTE|CALL|EMAIL|MEETING,description,dueDate?}`.
- `GET /crm/tasks?status&priority&dueBefore&page&size`; `POST /crm/tasks` `{title,description?,priority:LOW|MEDIUM|HIGH,dueDate?,customerId?}`; `PATCH /crm/tasks/{id}` partial update.

## Conventions

- Pagination: Spring `Page` JSON `{content,pageable,totalElements,totalPages,...}` — frontend reads `content`/`totalPages`/`totalElements`.
- Money: `BigDecimal` serialized as number. Dates: `LocalDateTime` ISO-8601.
- 401 → frontend clears session, redirects to `/login`. 403 on admin routes → redirect to storefront home with notice.
