# ShopX — Full-Stack E-Commerce + Admin CRM

A production-oriented e-commerce application: a **Spring Boot 3** REST API
(MySQL, JWT auth) plus a **React + Vite** storefront and an admin CRM.

```
final_ecommerce/
├── src/                  # Spring Boot backend (Java 17)
├── frontend/             # React 19 + Vite + Tailwind storefront & admin CRM
├── docs/                 # Backend audit, API integration notes
└── pom.xml
```

## Tech stack

| Layer    | Tech |
|----------|------|
| Backend  | Java 17, Spring Boot 3.2, Spring Security + JWT (JJWT), Spring Data JPA, MySQL 8, Maven (WAR) |
| Frontend | React 19, Vite, React Router 7, Tailwind CSS 4, Axios, React Hook Form + Zod, Recharts, Lucide, Context API, Vitest + RTL |

## Features

**Storefront**
- Product catalog with search, category filter, price/sort, pagination
- Product detail, cart (merge quantities, stock-aware), checkout with saved addresses, Cash on Delivery
- Customer auth (register/login/JWT), profile, password change, address book, order history & detail

**Admin CRM** (`/admin`, `ROLE_ADMIN` only)
- Dashboard: revenue, orders, customers, AOV, orders-by-status, sales chart, recent activity
- Customers: paginated/searchable list, 360° detail (orders, spend, segment), notes/interactions timeline, follow-up tasks
- Orders: filters, detail view, status transitions (PENDING→CONFIRMED→SHIPPED→DELIVERED / CANCELLED)
- Products & categories CRUD (soft-delete for products)
- Analytics: sales by day/week/month, registration trend, customer segments

**Security**
- JWT auth; registration cannot self-assign roles; secrets via env vars (`JWT_SECRET`, `ADMIN_PASSWORD`, DB creds)
- Cart/order ownership enforced; DTOs prevent entity/recursive serialization
- Order status transition validation; CORS restricted to configured frontend origin

## Prerequisites

- JDK 17+ (developed on JDK 25 — works fine)
- Maven 3.9+
- MySQL 8 (`shopping_db` schema auto-created via `ddl-auto=update`)
- Node.js 20+

## Backend setup

```bash
# PowerShell / bash — set env vars (or edit application.properties)
$env:DB_URL="jdbc:mysql://localhost:3306/shopping_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="root"
$env:JWT_SECRET="change-me-to-a-long-random-secret"   # required in prod
$env:ADMIN_PASSWORD="choose-a-strong-password"        # seeds the admin user
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173"

mvn spring-boot:run        # or: mvn clean package && java -jar target/shopping-backend-0.0.1-SNAPSHOT.war
```

API runs on `http://localhost:8080`. If `ADMIN_PASSWORD` is unset, a random
password is generated and printed once in the logs — set it for real use.

### Demo catalog seeding

```bash
node scripts/seed-catalog.mjs http://localhost:8080 admin <admin-password>
```

Creates ~10 categories and ~35 products with generated SVG images uploaded
through the real image API (`POST /api/products/{id}/images`). Idempotent —
skips names that already exist.

### Backend tests

```bash
mvn test                   # H2 in-memory DB; no MySQL needed
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:8080
npm run dev                # http://localhost:5173
```

### Frontend tests & build

```bash
npm test                   # Vitest + React Testing Library
npm run build              # production bundle → dist/
npm run preview            # preview the production build
```

## Default accounts

- Admin: `admin` / value of `ADMIN_PASSWORD` (or the generated one in startup logs)
- Customers register via `/register`

## Documentation

- `docs/backend-audit.md` — full audit of the original backend (endpoints, entities, risks)
- `docs/missing-backend-features.md` — gap analysis vs storefront/CRM requirements
- `docs/api-integration.md` — frontend↔backend contract notes

## Notes & limitations

- Payments are **Cash on Delivery only** — no payment gateway is integrated.
- Order totals = product subtotal; shipping is display-only on the storefront (not charged server-side).
- Admin "customer" column in order lists shows user ID (no username join in order DTOs).
- `ddl-auto=update` is used for dev convenience; use Flyway/Liquibase migrations for production.
- Product images are stored on disk under `uploads/` (configurable via `APP_UPLOAD_DIR`,
  default `./uploads`) and served at `/uploads/**`. Max 5 MB, image types only.
  For production use object storage (S3) instead of local disk.
- The repo's `target/` directory contains committed build artifacts (pre-existing); `.gitignore` now excludes it going forward.
