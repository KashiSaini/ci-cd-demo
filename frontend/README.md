# SkyBridge Frontend (React + Vite + Nginx Reverse Proxy)

Complete frontend for the Flight Booking Microservices monorepo.

## Why Zero CORS Changes Are Needed
- **Local Dev:** `vite.config.js` proxies `/api/auth`, `/api/flights`, `/api/bookings`, `/api/private-jets`, and `/api/admin` to ports `8001–8005`.
- **Production (EC2):** `nginx.conf` serves the built React SPA on **port 80** and reverse-proxies all `/api/*` paths directly to the 5 FastAPI containers over Docker's internal network.

## 1. Run Locally (Windows / Linux)
1. Copy the `frontend/` folder into the root of your `flight-booking-backend` repository.
2. Start your backend (or set `VITE_BACKEND_HOST=http://<YOUR_EC2_IP>` in `frontend/.env`).
3. Run:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## 2. Deploy on AWS EC2 with Docker Compose
1. Build and push the image (or add it to `.github/workflows/deploy.yml`):
```bash
docker build -f frontend/Dockerfile -t kashisaini/flight-frontend:latest .
docker push kashisaini/flight-frontend:latest
```
2. Add the service block from `docker-compose.frontend-snippet.yml` into `docker-compose.prod.yml` on EC2.
3. Pull and start on EC2:
```bash
docker compose -f docker-compose.prod.yml pull frontend
docker compose -f docker-compose.prod.yml up -d frontend
```
4. Open `http://<YOUR_EC2_IP>` (port 80 is already open in your AWS Security Group!).
