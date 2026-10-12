# 🪙Cryptocurrency Market Tracker App

A Dockerized full-stack cryptocurrency market tracker that displays live market data, historical OHLCV charts, technical-analysis indicators, and LSTM-based price predictions. The backend exposes a REST API for the frontend and runs an ETL pipeline that extracts data from external market APIs, transforms it, and loads it into MongoDB every 30 minutes. The frontend displays the collected data from the backend and it also automatically refetches the data periodically, allowing changes written by the pipeline to appear automatically in the interface.

Production application: **[https://crypto-market-tracker.duckdns.org](https://crypto-market-tracker.duckdns.org)**

## 🏛️Architecture

The application is a Dockerized microservices system for displaying cryptocurrency market data, historical OHLCV charts, technical indicators, and LSTM price predictions. Each application service has its own Docker image and communicates with the others through the Docker network.

### 💻Frontend

The frontend is a React and Vite application using Material UI for the interface and ApexCharts for market visualizations. It manages shared coin state through React contexts, requests data from the backend, and performs date-range filtering for the charts in the browser. It also refreshes coin data every 10 minutes so changes written by the ETL pipeline become visible without a full page reload. In production, the compiled Vite application is served by Nginx.

### ⚙️Backend

The backend is a Java 21 Spring Boot service that has two responsibilities: it is the application's REST API and it owns the market-data pipeline.

#### 🔄Data pipeline

The pipeline runs once when the backend starts and then executes every 30 minutes. It performs an ETL process:

1. **Extract** — retrieves cryptocurrency symbols, market summaries, and historical OHLCV data from external market APIs.
2. **Transform** — validates the responses, maps external API models to the application's domain models, normalizes values, filters out delisted assets and prepares the data for persistence.
3. **Load** — stores symbols, summaries, and historical data in MongoDB so the data can be reused by the frontend and the supporting services.

The pipeline uses a lock to prevent overlapping executions. If a previous run is still processing data, the next scheduled execution is skipped rather than running concurrently against the same database.

#### 🌐REST API and service orchestration

Besides performing ETL, the backend acts as the central REST API for the frontend. It connects the application to the technical-analysis and LSTM microservices, sends them the requested coin and timeframe context, and returns their results through backend API responses. The frontend therefore communicates with one backend entry point instead of needing to coordinate the internal microservices directly.

The backend also serves persisted market data and historical chart data from MongoDB. This gives the system a clear flow: the pipeline updates the database, the backend coordinates specialized analysis services, and the frontend receives a unified response containing the data needed to render the page.

## 🏗️Production infrastructure

### 🚢CI/CD flow

When code is pushed to `main` or `master`, the CI workflow builds the four application images independently: backend, frontend, LSTM predictor, and technical analysis. Each image is tagged with the commit SHA and published to Docker Hub. This gives every deployment an immutable, reproducible image version.

The CD workflow then connects to the Oracle VM, supplies the selected image tag and production environment values, pulls the matching images, and runs the production Compose configuration. Docker Compose recreates only the changed application containers while the external Atlas database remains persistent. Caddy continues serving HTTPS while the internal services restart. The workflow can perform a health check against the public API before marking deployment successful.

This separation allows CI to verify and publish artifacts independently from CD, while production always deploys a known image tag rather than rebuilding source code directly on the server.

### ☁️Oracle Cloud Interface

Production runs on an Oracle Cloud VM using Docker Compose, Docker Hub images, MongoDB Atlas, and Caddy. The VM hosts the application containers, while Atlas remains an externally managed database. An x86/AMD VM is used because the published images and machine-learning dependencies are built for that architecture.

The public DNS record points the application hostname to the VM's public IP. Caddy is the only container that publishes host ports: TCP `80` handles HTTP and ACME certificate challenges, TCP `443` handles HTTPS, and UDP `443` can handle HTTP/3. Caddy terminates TLS and forwards browser requests to the private Nginx frontend container.

Nginx serves the compiled frontend and proxies `/api/` requests to the Spring Boot backend. The backend communicates with the technical-analysis and LSTM containers over the private Docker network. Those services are not directly reachable from the internet. Backend ETL requests go outward to external market APIs, and database traffic goes outward from the VM to MongoDB Atlas. Atlas credentials are injected through environment variables and are never stored in images or committed files.

### 🚀Production request flow

```text
												  External market APIs for ETL
												↗
Browser → Caddy :443 → Nginx frontend :80 → backend :8080         →        MongoDb Atlas
                  								↘ technical-analysis :8082 ↗
                  								↘ lstm-predictor :8081     ↗
```

Only Caddy is exposed publicly. The frontend, backend, and Python services communicate over the private Docker network, and MongoDB Atlas is reached through outbound database connections.

## 🛠️Local development

### 📋Requirements

- Docker Desktop with Docker Compose
- Git
- Node.js 20.19+ or Node.js 22.12+ for frontend tooling
- Java 21 and Maven (only if running the backend outside Docker)

### 🐳Docker Compose configurations

There are two local docker compose configurations for local development and testing:

- `docker-compose-dev.yml` — Vite development server with Docker Compose Watch.
- `docker-compose.yml` — production-like frontend container served by Nginx, still using locally built images and local MongoDB.

### ⚡Recommended local development workflow

1. Clone the repository and open a terminal in the repository root.
2. Start Docker Desktop.
3. Edit `.env.local` if you want to override the default local MongoDB URI:

   ```dotenv
   MONGODB_URI=mongodb://mongodb:27017/crypto_db
   MONGODB_DATABASE=crypto_db
   ```

4. Now you have 2 ways to start the docker composition. For the <b>production-like</b> solution, use this:

   ```powershell
   docker compose --env-file .env.local -f docker-compose.yml up --build
   ```

   Or, if you want to see the changes in the code being reflected instantly inside the composition (changes in frontend/backend), use this instead:

   ```powershell
   docker compose --env-file .env.local -f docker-compose-dev.yml watch
   ```

   This is best used for <b>development</b>

5. Open the frontend at [http://localhost:3000](http://localhost:3000).
6. The local service endpoints are:
   - Backend: [http://localhost:8080](http://localhost:8080)
   - LSTM predictor: [http://localhost:8081](http://localhost:8081)
   - Technical analysis: [http://localhost:8082](http://localhost:8082)
   - MongoDB: `mongodb://localhost:27017/crypto_db`

7. Stop the stack with:

   ```powershell
   docker compose -f docker-compose-dev.yml down
   ```

8. To stop the stack and delete the local MongoDB data volume, use this only when a database reset is intended:

   ```powershell
   docker compose -f docker-compose-dev.yml down -v
   ```

## 🧠Memory optimization

The local and production-like Compose files include conservative settings for the Oracle Cloud free-tier VM:

- Java heap: `-Xms64m -Xmx256m -XX:+UseG1GC`
- TensorFlow intra-op and inter-op threads limited to `1`
- OpenMP and MKL threads limited to `1`
- `MALLOC_ARENA_MAX=2` for Python services
- Local MongoDB WiredTiger cache limited to `0.25 GB`

These settings reduce peak memory usage without imposing a hard Docker memory cap that could terminate the LSTM service during model loading.

## 📄Project documentation

The repository also contains the project and requirements documentation:

- [Short project description](./documentation/KratokOpis.pdf)
- [Software requirements specification](./documentation/SrsDocumentation.pdf)

## 📂Project structure

```text
.
├── backend/                              Spring Boot REST API
├── frontend/                             React/Vite application
├── microservices/
│   ├── ltsm-predictor-service/           LSTM FastAPI service
│   └── technical-analysis-service/       Technical-analysis FastAPI service
├── caddy/                                Production HTTPS configuration
├── documentation/                        Project and SRS PDFs
├── docker-compose-dev.yml                Development Compose stack
├── docker-compose.yml                    Local production-like stack
├── docker-compose.prod.yml               OCI production stack
└── .github/workflows/
    ├── ci-images.yml                     Build and publish images
    └── cd-oracle.yml                     Deploy to Oracle Cloud
```
