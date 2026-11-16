# Missing Backend Features

Features the React storefront and Admin CRM require that do not exist in the backend today.
Grouped by priority. All new admin endpoints require `ROLE_ADMIN` enforced server-side via `@PreAuthorize`/`SecurityConfig`. All new tables are created by `ddl-auto=update` (no migration tool in project).

## 1. Required for the basic storefront

| Endpoint | Method | Purpose | Request | Response | Notes |
|---|---|---|---|---|---|
| `/api/categories` | GET | List categories for nav/filters | — | `List<Category>` | Public. SecurityConfig already permits `/api/categories/**` |
| `/api/cart/item/{itemId}` | PUT | Update cart item quantity | param `quantity` (1..stock) | `CartItemResponse` | Verifies ownership; rejects qty > stock |
| `/api/orders/{id}` | GET | Order detail for owner | — | `OrderResponse` (items + address snapshot) | 404/403 if not owner |
| `/api/products` | GET (extend) | Filters | add `minPrice,maxPrice,sort` (`price_asc`,`price_desc`,`newest`) | `Page<ProductResponse>` | Server-side; search already exists |
| `/api/auth/me` | GET | Current user profile | — | `UserResponse` (no password) | Needed by AuthContext on reload |
| `/api/auth/me` | PUT | Update profile (email, fullName, phone) | `{email?,fullName?,phone?}` | `UserResponse` | Unique-email check |
| `/api/auth/password` | PUT | Change password | `{currentPassword,newPassword}` | `{message}` | Verify current via encoder |
| `/api/addresses` | GET/POST | List/create addresses | `{label,fullName,phone,addressLine1,addressLine2,city,state,postalCode,country,default?}` | `Address`/`AddressResponse` | Owned by caller only |
| `/api/addresses/{id}` | PUT/DELETE | Update/delete address | same DTO | — | Ownership check |
| `/api/orders/place` | POST (extend) | Accept `addressId` param | param `addressId` | existing + `address` | Snapshot address onto order |

DTO changes (not new endpoints): `CartItemResponse`, `OrderResponse`, `ProductResponse`(optional), `UserResponse`, `AuthResponse` — stop serializing entities with back-references.

## 2. Required for authentication (fixes, not features)

- Register must ignore client-supplied `role` (always `USER`), validate email format/uniqueness, return field errors.
- Login response already returns `{token,username,role}` — keep contract, add `id`,`email`.
- JWT secret/expiry must come from `jwt.secret`/`jwt.expiration` properties (currently hardcoded).
- Expired/invalid tokens must yield 401, not 500.
- Admin bootstrap: `ApplicationRunner` creates admin from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars when users table is empty of admins.

## 3. Required for order management (admin)

| Endpoint | Method | Purpose | Notes |
|---|---|---|---|
| `/api/admin/orders` | GET | Paged order list | params `page,size,status,from,to,search` (order id / customer username) |
| `/api/admin/orders/{id}` | GET | Order detail incl. customer + items | |
| `/api/admin/orders/{id}/status` | PUT | Status transition | Reuse `/api/orders/{id}/status` or move under admin; enforce valid transitions: `PENDING→CONFIRMED→SHIPPED→DELIVERED`, `PENDING/CONFIRMED→CANCELLED` |
| `/api/admin/products` | GET | Paged product list incl. inactive | params `page,size,q,categoryId,active` |

## 4. Required for the Admin CRM

| Endpoint | Method | Purpose | Request | Response |
|---|---|---|---|---|
| `/api/admin/dashboard/summary` | GET | KPI cards | — | `{totalCustomers,totalOrders,totalRevenue,avgOrderValue,newCustomers30d,ordersByStatus:{...},recentOrders:[],recentCustomers:[],topProducts:[]}` |
| `/api/admin/analytics/sales` | GET | Sales series | `from,to,groupBy=day\|week\|month` | `[{period,revenue,orders}]` |
| `/api/admin/analytics/customers` | GET | Acquisition + segments | `days` (default 30) | `{registrations:[{date,count}],segments:{new,repeat,highValue,inactive,recent}}` |
| `/api/admin/customers` | GET | Paged customer list | `page,size,search,sort` | `Page<CustomerSummary>` — id, username, email, fullName, phone, createdAt, orderCount, totalSpent, lastOrderAt. **Never include password/hash** |
| `/api/admin/customers/{id}` | GET | Customer 360 | — | profile + spend stats + segments + counts |
| `/api/admin/customers/{id}/orders` | GET | Customer orders | `page,size` | `Page<OrderSummary>` |
| `/api/admin/customers/{id}/interactions` | GET/POST | Activity timeline | POST `{type:NOTE\|CALL\|EMAIL\|MEETING,description,dueDate?}` | `List<CustomerInteraction>` |
| `/api/admin/crm/tasks` | GET | Task list | `status,priority,assigneeId,dueBefore,page,size` | `Page<CrmTask>` |
| `/api/admin/crm/tasks` | POST | Create task | `{title,description,priority,dueDate,customerId?}` | `CrmTask` |
| `/api/admin/crm/tasks/{id}` | PATCH | Update task | `{title?,description?,priority?,status?,dueDate?,customerId?}` | `CrmTask` |
| `/api/admin/categories` | GET/POST/PUT/DELETE | Category CRUD | `{name,slug,imageUrl}` | `Category` |

New entities: `Address` (userId FK-style Integer consistent with existing, or `@ManyToOne` — follow Order's Integer convention), `CustomerInteraction`, `CrmTask` (+ optional `assignee` = admin username string). Add indexes on `orders.user_id`, `orders.created_at`, `customer_interaction.customer_id`, `crm_task.status/due_date`.

Segment definitions (documented, computed — no segment tables):
- **New**: registered ≤ 30 days ago, 0 orders.
- **Repeat**: ≥ 2 orders.
- **High-value**: total completed-order spend ≥ configurable threshold (default top decile or fixed $500 — pick fixed, document).
- **Inactive**: no order in last 90 days and registered > 90 days ago.
- **Recent purchasers**: order in last 30 days.

## 5. Optional improvements (only if time permits)

- CSV export `GET /api/admin/customers/export`.
- Product image upload (currently `imageUrl` string only — keep URL-based).
- Reviews/ratings, wishlist, coupons, shipping methods, real payment gateway — **out of scope**; checkout is COD-only.
- Refresh tokens — not implemented; document sessionStorage tradeoff.
