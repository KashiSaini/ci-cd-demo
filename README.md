# SkyBridge — Full-Stack Flight & Private Jet Booking Platform (Microservices + CI/CD)

A full-stack, containerized flight and private jet booking platform built with a **React + Vite + Nginx** frontend (`SkyBridge`) and five **Python/FastAPI** microservices in a single monorepo. The project features an automated **GitHub Actions CI/CD pipeline** with Ruff linting, ephemeral **PostgreSQL + Redis** integration tests, parallel **Docker Hub** matrix builds (5 backend services + 1 frontend image), automated **Alembic** database migrations, and continuous deployment to **AWS EC2** via **Docker Compose v2**.

---

## System Architecture

All client traffic enters through a single **Nginx Reverse Proxy** on port `80` inside the `frontend` container. Nginx serves the compiled React SPA and routes `/api/*` requests over Docker's private internal network to the appropriate FastAPI microservice—eliminating cross-origin (CORS) issues and keeping backend services isolated.

```text
                        Browser / Client
                               │
                               ▼  (Port 80 — Single Entry Point)
                ┌──────────────────────────────┐
                │   Frontend Container (Nginx) │
                │   • Serves React + Vite SPA  │
                │   • Reverse Proxies /api/*   │
                └──────────────┬───────────────┘
                               │  (Internal Docker Network)
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
       ▼                       ▼                       ▼
 /api/auth/*             /api/flights/*          /api/bookings/*
auth-service:8000       flight-service:8000     booking-service:8000
       │                       │                       │
 /api/private-jets/*     /api/admin/*                  │
private-jet:8000        admin-service:8000             │
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
              ┌─────────────────────────────────┐
              │   Core Data & Event Layer       │
              │ • PostgreSQL 15 (Primary DB)    │
              │ • Redis 7 (Sessions / Cache)    │
              │ • Kafka & MongoDB (Optional)    │
              └─────────────────────────────────┘
```

---

## Services & Components

| Component | Nginx Route | Host Port | Docker Hub Image | Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend (`SkyBridge`)** | `/` | `80` | `kashisaini/flight-frontend:latest` | React + Vite SPA and Nginx reverse proxy for all backend services |
| **Auth Service** | `/api/auth/` | `8001` | `kashisaini/flight-auth-service:latest` | User registration, login, JWT issuance/refresh, user listing, and admin promotion |
| **Flight Service** | `/api/flights/` | `8002` | `kashisaini/flight-flight-service:latest` | Flight search, seat maps, and admin flight creation/deletion |
| **Booking Service** | `/api/bookings/` | `8003` | `kashisaini/flight-booking-service:latest` | Multi-seat ticket booking, booking history, cancellations, and non-blocking Kafka producer |
| **Private Jet Service** | `/api/private-jets/` | `8004` | `kashisaini/flight-private-jet-service:latest` | Private jet fleet listings, hourly charter bookings, and cancellations |
| **Admin Service** | `/api/admin/` | `8005` | `kashisaini/flight-admin-service:latest` | System logs, booking event telemetry, and analytics (via Kafka/MongoDB) |

### Frontend Features (`SkyBridge`)
* **Authentication & Role Detection:** Sign Up, Sign In, automatic JWT decoding (`is_admin` role detection), silent access-token refresh via `/auth/refresh`, Logout, and a live `API LIVE` navbar health indicator (`/auth/ping`).
* **Flight Search & Interactive Seat Map:** Filter flights by source, destination, date, cabin class (`economy`, `premium`, `business`), and max price; open an interactive seat map to select multiple seats, assign passenger names and stopover destinations, and confirm bookings.
* **My Bookings:** View confirmed and cancelled tickets with booking references, seat assignments, prices, and one-click cancellation.
* **Private Jet Charter:** Browse available private jets, book charters by start/end datetime with live hourly cost calculation, and cancel charters by Booking ID.
* **Admin Console:** Automatically unlocked for admin accounts—create/delete flights, add private jets, promote users to Admin, and inspect telemetry with graceful fallback if optional MongoDB/Kafka services are offline.

### Core Infrastructure
* **PostgreSQL 15 (`postgres:15-alpine`):** Primary relational database with a persistent Docker volume (`postgres_data`) and `pg_isready` healthchecks.
* **Redis 7 (`redis:7-alpine`):** Token/session store and cache with `redis-cli ping` healthchecks.
* **Kafka & MongoDB (Optional):** `booking-service` initializes its Kafka producer asynchronously in a non-blocking background task so the stack boots cleanly on resource-constrained EC2 instances even without Kafka or MongoDB running.

---

## Repository Structure

```text
flight-booking-backend/
├── .github/
│   └── workflows/
│       └── deploy.yml              # 4-stage CI/CD pipeline (lint → test → build → deploy)
├── alembic/                        # Centralized SQLAlchemy/Alembic database migrations
├── alembic.ini                     # Alembic configuration
├── frontend/                       # SkyBridge React + Vite + Nginx frontend
│   ├── src/
│   │   ├── api/client.js           # Unified API client with automatic JWT refresh
│   │   ├── components/             # Navbar, BookingModal (seat map), Toast
│   │   ├── context/AuthContext.jsx # Auth state and role management
│   │   └── pages/                  # AuthPage, FlightsPage, BookingsPage, PrivateJetsPage, AdminPage
│   ├── Dockerfile                  # Multi-stage Node build → Nginx Alpine runtime
│   ├── nginx.conf                  # SPA routing + reverse proxy to all 5 backend containers
│   ├── vite.config.js              # Local dev proxy mapping /api/* → :8001–:8005
│   └── package.json
├── services/
│   ├── admin-service/
│   ├── auth-service/
│   ├── booking-service/
│   ├── flight-service/
│   └── private-jet-service/
├── shared/                         # Shared ORM models, DB session setup, and utilities
├── tests/
│   └── test_integration.py         # Async PostgreSQL & Redis integration tests
├── docker-compose.yml              # Local development stack
├── docker-compose.prod.yml         # Production stack (Frontend + 5 services + Postgres + Redis)
├── requirements.txt                # Shared Python dependencies
├── ruff.toml                       # Ruff static analysis rules
└── README.md
```

---

## CI/CD Pipeline Architecture

Every push to `main` triggers `.github/workflows/deploy.yml`. Strict `needs:` safety gates ensure that broken code never builds or deploys to production.

```text
[ Push to main ]
       │
       ▼
┌──────────────────────┐
│ 1. lint              │  Ruff static code analysis (ruff.toml)
└──────────┬───────────┘
           │ needs: [lint]
           ▼
┌──────────────────────┐
│ 2. integration-test  │  Ephemeral Postgres 15 + Redis 7 + Alembic + Pytest
└──────────┬───────────┘
           │ needs: [integration-test]
           ├─────────────────────────────┐
           ▼                             ▼
┌────────────────────────┐    ┌────────────────────────┐
│ 3a. build-and-push     │    │ 3b. build-frontend     │
│ Parallel 5-service     │    │ React + Vite + Nginx   │
│ Matrix → Docker Hub    │    │ Image → Docker Hub     │
└──────────┬─────────────┘    └──────────┬─────────────┘
           └──────────────┬──────────────┘
                          │ needs: [build-and-push, build-frontend]
                          ▼
┌──────────────────────────────────────────────────────┐
│ 4. deploy                                            │
│ SSH to AWS EC2 → Pull Images → Compose Up → Migrate  │
└──────────────────────────────────────────────────────┘
```

### Stage Breakdown
1. **Lint (`lint`):** Runs `ruff check` across the Python monorepo to catch syntax errors, unused imports, and style violations immediately.
2. **Integration Testing (`integration-test`):** Spins up ephemeral PostgreSQL 15 and Redis 7 service containers inside the GitHub Actions runner, applies Alembic migrations, and runs `pytest tests/test_integration.py`.
3. **Parallel Builds (`build-and-push` & `build-frontend`):** Builds all 5 Python microservice images via `strategy.matrix` in parallel alongside the multi-stage React + Nginx `frontend` image, pushing all 6 images to Docker Hub (`kashisaini/flight-*:latest`).
4. **Automated Deployment (`deploy`):** Uses `appleboy/ssh-action` to connect to AWS EC2, pull the latest images, recreate containers with `docker-compose.prod.yml`, and execute `alembic upgrade head`.

---

## Configuration & Secrets

### 1. GitHub Actions Secrets
Configure these under **Repository Settings → Secrets and variables → Actions**:

| Secret | Description |
| :--- | :--- |
| `DOCKER_USERNAME` | Docker Hub username (e.g., `kashisaini`) |
| `DOCKER_PASSWORD` | Docker Hub password or Personal Access Token |
| `EC2_HOST` | Public IPv4 address (or AWS Elastic IP) of the EC2 instance |
| `EC2_USER` | EC2 SSH username (e.g., `ubuntu`) |
| `EC2_SSH_KEY` | Private `.pem` SSH key for EC2 authentication |

> **Tip:** Without an AWS Elastic IP, stopping and restarting an EC2 instance assigns a new Public IPv4 address. Update `EC2_HOST` in GitHub Secrets whenever the IP changes.

### 2. EC2 Environment File (`~/flight-booking-backend/.env`)
Database and cache URLs must reference the Docker Compose service names (`postgres`, `redis`), not `localhost`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:<password>@postgres:5432/flight
REDIS_URL=redis://redis:6379/0
JWT_SECRET_KEY=<your-jwt-secret>
```

---

## Local Development

### Backend Quality Checks
Run the same CI checks locally before pushing to `main`:

```bash
# Run Ruff linter
python -m ruff check .

# Run integration tests (requires local Postgres & Redis)
pytest tests/test_integration.py
```

### Frontend Development Server
You can run the React frontend locally against either a local backend (`localhost:8001–8005`) or your live EC2 backend:

1. Create `frontend/.env` (optional—only needed if targeting EC2 instead of `localhost`):
   ```env
   VITE_BACKEND_HOST=http://<YOUR_EC2_PUBLIC_IP>
   ```
2. Install dependencies and start Vite:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *(On Windows PowerShell, if execution policies block `npm.ps1`, use `npm.cmd install` and `npm.cmd run dev`.)*
3. Open `http://localhost:5173`.

---

## Production Deployment (AWS EC2)

### Initial Server Setup
1. **Install Docker & Docker Compose v2** on Ubuntu EC2.
2. **Configure a 2 GB Swap File** (prevents out-of-memory freezes on small/free-tier instances):
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
3. **Configure AWS Security Group Inbound Rules:**
   * `22` (SSH) — Required for GitHub Actions and terminal access.
   * `80` (HTTP) — Serves the SkyBridge UI and proxies all `/api/*` traffic through Nginx.
   * `8001–8005` (Optional) — Only needed if you want direct public access to individual FastAPI Swagger docs; can be closed once Nginx on port `80` is active.

### Manual Operations & Troubleshooting on EC2
```bash
cd ~/flight-booking-backend

# Pull latest images and recreate containers
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Run Alembic database migrations manually
docker compose -f docker-compose.prod.yml exec auth-service sh -c "cd /code && alembic upgrade head"

# Check container status, health, and ports
docker compose -f docker-compose.prod.yml ps

# View recent logs for any service
docker compose -f docker-compose.prod.yml logs --tail=50 booking-service
docker compose -f docker-compose.prod.yml logs --tail=50 frontend
```

---

## Live Endpoints & Verification

* **Web Application (SkyBridge UI):** `http://<EC2_HOST>` *(use `http://`, not `https://`, unless SSL is configured)*
* **Direct Swagger Docs (if ports `8001–8005` are open):**
  * Auth: `http://<EC2_HOST>:8001/docs`
  * Flights: `http://<EC2_HOST>:8002/docs`
  * Bookings: `http://<EC2_HOST>:8003/docs`
  * Private Jets: `http://<EC2_HOST>:8004/docs`
  * Admin: `http://<EC2_HOST>:8005/docs`

### End-to-End Smoke Test
1. Open `http://<EC2_HOST>` and verify the **API LIVE** badge in the top-left navbar is green.
2. Sign in with an admin account, open **Admin → Flights**, and create a flight.
3. Switch to **Flights**, open the interactive seat map, select a seat, and complete a booking.
4. Confirm the ticket appears under **My Bookings** with its booking reference and seat assignment.