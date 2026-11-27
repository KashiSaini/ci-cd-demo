# Flight Booking Microservices Backend (CI/CD Enabled)

A production-ready Python/FastAPI microservices monorepo for a flight and private jet booking platform, featuring an automated 4-stage **GitHub Actions CI/CD pipeline**, **Docker Hub** parallel matrix builds, **PostgreSQL + Redis** integration testing, automated **Alembic** migrations, and continuous deployment to **AWS EC2** via **Docker Compose v2**.

---

## Architecture & Microservices

All five microservices live in a single monorepo alongside a root `shared/` module and centralized Alembic database migrations. Each service runs internally on port `8000` and is exposed on its own dedicated host port in production.

| Service | Host Port | Docker Hub Image | Responsibility |
| :--- | :---: | :--- | :--- |
| **Auth Service** | `8001` | `kashisaini/flight-auth-service:latest` | User registration, authentication, JWT issuance, and Redis session/token handling |
| **Flight Service** | `8002` | `kashisaini/flight-flight-service:latest` | Flight listings, search, and schedule management |
| **Booking Service** | `8003` | `kashisaini/flight-booking-service:latest` | Ticket bookings with non-blocking background Kafka producer initialization |
| **Private Jet Service** | `8004` | `kashisaini/flight-private-jet-service:latest` | Private jet charter listings and reservations |
| **Admin Service** | `8005` | `kashisaini/flight-admin-service:latest` | Administrative operations and system management |

### Core Infrastructure
* **PostgreSQL 15** (`postgres:15-alpine`) — Primary relational database with persistent Docker volumes and `pg_isready` healthchecks.
* **Redis 7** (`redis:7-alpine`) — Caching and token/session store with `redis-cli ping` healthchecks.
* **Kafka (Optional)** — `booking-service` connects asynchronously in a background task so the service boots cleanly even when Kafka is not deployed on resource-constrained EC2 instances.

---

## Repository Structure

```text
flight-booking-backend/
├── .github/
│   └── workflows/
│       └── deploy.yml              # 4-stage CI/CD pipeline (lint → test → build → deploy)
├── alembic/                        # Centralized database migration scripts
├── alembic.ini                     # Alembic configuration
├── services/
│   ├── admin-service/
│   ├── auth-service/
│   ├── booking-service/
│   ├── flight-service/
│   └── private-jet-service/
├── shared/                         # Shared models, DB config, and utilities across services
├── tests/
│   └── test_integration.py         # Async PostgreSQL & Redis integration tests
├── docker-compose.prod.yml         # Production stack (5 services + Postgres + Redis)
├── ruff.toml                       # Ruff static analysis and linting rules
└── README.md
```

---

## CI/CD Pipeline Architecture

Every push to the `main` branch automatically triggers `.github/workflows/deploy.yml`. Stages are guarded by strict `needs:` safety gates—if linting or integration tests fail, broken code is never built or deployed.

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
│ 2. integration-test  │  Ephemeral Postgres 15 + Redis 7 containers + Alembic + Pytest
└──────────┬───────────┘
           │ needs: [integration-test]
           ▼
┌──────────────────────┐
│ 3. build-and-push    │  Parallel 5-service Matrix Build → Docker Hub (:latest)
└──────────┬───────────┘
           │ needs: [build-and-push]
           ▼
┌──────────────────────┐
│ 4. deploy            │  SSH to AWS EC2 → Pull Images → Compose Up → Alembic Upgrade
└──────────────────────┘
```

### Stage Breakdown
1. **Lint (`lint`)**: Runs `ruff check` across the monorepo using `ruff.toml` to catch syntax errors, unused imports, and formatting issues immediately.
2. **Integration Testing (`integration-test`)**: Spins up ephemeral PostgreSQL and Redis service containers inside the GitHub Actions runner, applies migrations, and runs `tests/test_integration.py` to verify real database and cache connectivity.
3. **Parallel Matrix Build & Push (`build-and-push`)**: Uses GitHub Actions `strategy.matrix` to build all 5 Docker images simultaneously from the monorepo root context and pushes them to Docker Hub (`kashisaini/flight-<service>:latest`).
4. **Automated Deployment (`deploy`)**: Connects to the Ubuntu AWS EC2 instance via `appleboy/ssh-action`, pulls the newly pushed images, recreates containers with `docker-compose.prod.yml`, and runs `alembic upgrade head`.

---

## Configuration & Secrets

### 1. GitHub Actions Secrets
Configure the following secrets in **Repository Settings → Secrets and variables → Actions**:

| Secret | Description |
| :--- | :--- |
| `DOCKER_USERNAME` | Docker Hub username (e.g., `kashisaini`) |
| `DOCKER_PASSWORD` | Docker Hub password or Personal Access Token |
| `EC2_HOST` | Public IPv4 address (or Elastic IP) of the AWS EC2 instance |
| `EC2_USER` | EC2 SSH username (e.g., `ubuntu`) |
| `EC2_SSH_KEY` | Private `.pem` SSH key for EC2 authentication |

> **Tip:** If your EC2 instance is stopped and restarted without an AWS Elastic IP, its public IPv4 address will change. Update `EC2_HOST` in GitHub Secrets before pushing new commits.

### 2. Server Environment File (`.env`)
Place a `.env` file in `~/flight-booking-backend/.env` on the EC2 server. Ensure database and cache URLs point to the Docker Compose service names (`postgres` and `redis`), not `localhost`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:<password>@postgres:5432/flight
REDIS_URL=redis://redis:6379/0
JWT_SECRET_KEY=<your-jwt-secret>
```

---

## Local Development & Quality Checks

Run the same checks locally before pushing to `main`:

```bash
# 1. Run Ruff linter
python -m ruff check .

# 2. Run integration tests (requires local Postgres & Redis)
pytest tests/test_integration.py
```

---

## Production Deployment (AWS EC2)

### Initial Server Preparation
1. **Install Docker & Docker Compose v2** on Ubuntu EC2.
2. **Configure a 2 GB Swap File** (recommended for small/free-tier instances to prevent OOM freezes during container restarts):
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
3. **Configure AWS Security Group Inbound Rules**:
   * `22` (SSH)
   * `80` / `443` (HTTP / HTTPS)
   * `8001` – `8005` (Custom TCP for the 5 FastAPI microservices)

### Manual Operations & Maintenance on EC2
```bash
cd ~/flight-booking-backend

# Pull latest images and start/update all services
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Run Alembic database migrations manually if needed
docker compose -f docker-compose.prod.yml exec auth-service sh -c "cd /code && alembic upgrade head"

# Check container health and port mappings
docker compose -f docker-compose.prod.yml ps

# Inspect logs for a specific service
docker compose -f docker-compose.prod.yml logs --tail=50 booking-service
```

---

## API Documentation & Verification

Once deployed, each microservice exposes interactive FastAPI Swagger documentation:

* **Auth Service:** `http://<EC2_HOST>:8001/docs`
* **Flight Service:** `http://<EC2_HOST>:8002/docs`
* **Booking Service:** `http://<EC2_HOST>:8003/docs`
* **Private Jet Service:** `http://<EC2_HOST>:8004/docs`
* **Admin Service:** `http://<EC2_HOST>:8005/docs`

### Quick Smoke Test
1. Verify local container responsiveness on EC2:
   ```bash
   curl -I http://localhost:8001/docs
   curl -I http://localhost:8003/docs
   ```
2. Open `:8001/docs`, call `POST /register` and `POST /login` to obtain a JWT `access_token`.
3. Open `:8002/docs`, click **Authorize**, paste the token, and call `GET /flights` to confirm end-to-end database, Redis, and cross-service authentication.