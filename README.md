# nrix7-ecommerce-layout

## Stack
- **Backend:** Go, Gin, GORM, PostgreSQL, gRPC client, Logrus, secure headers, rate limiters.
- **Realtime:** Go, Gin, gRPC server, SSE hub, WebSocket hub, JWT auth, admin key gate.
- **Frontend:** Vite, React, TypeScript, Tailwind CSS, Radix UI, Redux Toolkit, React Query.
- **Edge:** Nginx for TLS termination, routing, and static delivery.

## Architecture
- Frontend builds with Vite and ships behind Nginx; clients can hit any Nginx node via DNS rotation.
- Nginx proxies REST traffic to stateless backend replicas on `:9997`, backed by shared PostgreSQL.
- Backend modules cover auth, products, orders, chat, analytics, newsletter, contact, and audio uploads.
- Backend talks to the realtime service over gRPC; events fan out to SSE and WebSocket subscribers.
- Realtime service keeps in-memory connection state while serving `/api` SSE/WS endpoints.
- Scripts and cron artifacts under `backend/scripts` and `backend-data` support ops tasks.

## Advantages
- Backend is stateless, so scale out to N instances without session affinity.
- Realtime service is the only stateful piece; sharding can land later without blocking day-one.
- Nginx layer is stateless and horizontally scalable; frontend randomly selects any edge node.
- Shared proto contracts keep synchronous and realtime channels aligned and versioned.
- Security middleware, rate limiting, and admin-keyed gRPC harden the surface at scale.

## Development
- `docker-compose.prod.yml` wires Nginx, backend, realtime, and Postgres; inject secrets via env.
- Each Go service ships with a `Makefile` for lint, test, and build automation.
- Frontend: `npm install` then `npm run dev` for local preview.

## Contributing
- Open source project; issues and pull requests are welcome.
