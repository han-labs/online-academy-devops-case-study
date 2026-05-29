# Architecture Overview

## Project

Online Academy DevOps Case Study

This document describes the system architecture of the Online Academy application, including the application structure, deployment topology, runtime components, request flow, database design overview, security boundaries, and operational checks.

## Architecture Summary

Online Academy is currently implemented as a monolithic Node.js web application.

The application is deployed as a Docker container on an AWS EC2 Ubuntu server. Nginx is used as a reverse proxy in front of the application. Supabase PostgreSQL is used as the managed database.

Current high-level architecture:

```text
User Browser
-> EC2 Public IPv4, Port 80
-> Nginx Reverse Proxy
-> Docker Container: Node.js Express App, Port 3000
-> Supabase PostgreSQL
```

The internal application port `3000` is not publicly exposed. Public traffic enters through Nginx on port `80`.

## Key Architecture Decisions

| Decision                 | Current Choice                  | Reason                                                             |
| ------------------------ | ------------------------------- | ------------------------------------------------------------------ |
| Application architecture | Monolithic web application      | Simpler and suitable for an internship-level case study            |
| Backend runtime          | Node.js with Express            | Lightweight and familiar JavaScript backend stack                  |
| View layer               | Handlebars with Bootstrap 5     | Server-side rendered UI with simple styling                        |
| Database                 | Supabase PostgreSQL             | Managed PostgreSQL database without maintaining DB server manually |
| Session storage          | PostgreSQL-backed session store | Avoids Express MemoryStore in production-like deployment           |
| Deployment unit          | Docker container                | Consistent runtime between local machine and EC2                   |
| Orchestration            | Docker Compose                  | Simple and suitable for single-server deployment                   |
| Reverse proxy            | Nginx                           | Exposes public HTTP port and forwards traffic to internal app port |
| Health check             | `/healthz`                      | Confirms application process is running                            |
| Readiness check          | `/readyz`                       | Confirms environment variables and database connectivity           |
| Verification             | Smoke test                      | Validates main routes after deployment                             |

## Runtime Architecture

```text
+------------------+
|  User Browser    |
+--------+---------+
         |
         | HTTP request, port 80
         v
+------------------+
| AWS EC2 Ubuntu   |
| Public IPv4      |
+--------+---------+
         |
         | Nginx reverse proxy
         v
+-------------------------------+
| Docker Container              |
| Node.js Express Application   |
| Internal Port: 3000           |
+--------+----------------------+
         |
         | PostgreSQL connection over SSL
         v
+-------------------------------+
| Supabase PostgreSQL           |
| Managed Database              |
+-------------------------------+
```

## Deployment Topology

```text
AWS EC2 Ubuntu Server
|
|-- Nginx
|   |-- Listens on port 80
|   |-- Proxies requests to 127.0.0.1:3000
|
|-- Docker Engine
|   |-- Docker Compose
|       |-- online-academy-app container
|
|-- Application files
|   |-- Dockerfile
|   |-- docker-compose.yml
|   |-- .env, stored only on EC2
|
|-- Logs
    |-- Docker Compose logs
    |-- Nginx access log
    |-- Nginx error log
```

## Request Flow

### Normal Web Request

```text
1. User opens http://EC2_PUBLIC_IP
2. Request reaches EC2 on port 80
3. Nginx receives the request
4. Nginx forwards the request to http://127.0.0.1:3000
5. Express handles the request
6. Application queries Supabase PostgreSQL when needed
7. Express renders Handlebars view
8. Nginx returns the response to the user
```

### Health Check Request

```text
User or operator
-> http://EC2_PUBLIC_IP/healthz
-> Nginx
-> Express /healthz
-> JSON response with status ok
```

Purpose:

```text
Confirms that the Node.js application process is running.
```

### Readiness Check Request

```text
User or operator
-> http://EC2_PUBLIC_IP/readyz
-> Nginx
-> Express /readyz
-> Checks required environment variables
-> Checks database connectivity
-> JSON response with status ready
```

Purpose:

```text
Confirms that the application is ready to serve traffic and can connect to the database.
```

## Application Structure

Main project structure:

```text
online-academy/
├── app.js
├── package.json
├── package-lock.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── middlewares/
├── models/
├── routes/
├── utils/
├── views/
├── public/
├── static/
├── scripts/
│   └── smoke-test.js
├── DEPLOYMENT.md
├── RUNBOOK.md
└── ARCHITECTURE.md
```

Important responsibilities:

| Folder/File             | Responsibility                                                |
| ----------------------- | ------------------------------------------------------------- |
| `app.js`                | Express application setup, middleware, routes, server startup |
| `routes/`               | HTTP route definitions                                        |
| `models/`               | Database access logic                                         |
| `middlewares/`          | Authentication, authorization, error handling, OAuth          |
| `views/`                | Handlebars UI templates                                       |
| `public/`               | Static public assets                                          |
| `static/`               | CSS and frontend JavaScript assets                            |
| `scripts/smoke-test.js` | Post-deployment route verification                            |
| `Dockerfile`            | Application image build definition                            |
| `docker-compose.yml`    | Container runtime definition                                  |
| `.env.example`          | Environment variable template without real secrets            |

## Main Application Modules

| Module                    | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| Authentication            | Local login, session handling, Google OAuth support    |
| Role-based access control | Separates admin, instructor, student, and guest access |
| Course catalog            | Course listing, search, filtering, and detail pages    |
| Learning player           | Course learning interface and preview lessons          |
| Guest preview mode        | Allows public users to watch selected preview lessons  |
| Student learning mode     | Allows enrolled students to access full course content |
| Progress tracking         | Tracks completed lectures for enrolled students        |
| Reviews                   | Allows students to submit course reviews               |
| Admin management          | Supports admin-level management pages                  |
| Instructor management     | Supports course, chapter, and lecture management       |

## Database Overview

The application uses Supabase PostgreSQL.

Main tables:

| Table              | Purpose                                                         |
| ------------------ | --------------------------------------------------------------- |
| `users`            | Stores student, instructor, and admin accounts                  |
| `categories`       | Stores course categories                                        |
| `courses`          | Stores course information                                       |
| `chapters`         | Groups lectures inside a course                                 |
| `lectures`         | Stores lesson information and video URLs                        |
| `enrollments`      | Tracks which users are enrolled in which courses                |
| `lecture_progress` | Tracks completed lectures                                       |
| `reviews`          | Stores course reviews and ratings                               |
| `watchlists`       | Stores saved courses                                            |
| `otps`             | Stores OTP information                                          |
| `session`          | Stores Express sessions using PostgreSQL-backed session storage |

## Session Architecture

The application does not use Express MemoryStore in the production-like deployment.

Current session flow:

```text
Browser
-> Session cookie
-> Express application
-> PostgreSQL-backed session store
-> Supabase PostgreSQL session table
```

Reason:

```text
MemoryStore is not suitable for production-like environments because sessions are stored only in application memory and are lost when the process restarts.
```

Benefits of PostgreSQL-backed sessions:

* Sessions survive container restarts
* Session storage is externalized from application memory
* More suitable for production-like deployment
* Avoids Express MemoryStore warning

## Environment and Secret Management

Secrets are not stored in GitHub.

Configuration strategy:

| Location       | Purpose                                |
| -------------- | -------------------------------------- |
| `.env.example` | Public template for required variables |
| Local `.env`   | Local development secrets              |
| EC2 `.env`     | Production-like deployment secrets     |
| GitHub Secrets | CI/CD deployment credentials           |

Sensitive values include:

```text
SESSION_SECRET
DB_PASSWORD
GOOGLE_CLIENT_SECRET
EC2_SSH_KEY
```

The production `.env` file is created directly on EC2 and protected with:

```bash
chmod 600 .env
```

## Network and Port Design

Current public exposure:

| Port |             Public? | Purpose                           |
| ---: | ------------------: | --------------------------------- |
|   22 | Restricted to My IP | SSH administration                |
|   80 |              Public | HTTP access through Nginx         |
|  443 |              Public | Reserved for future HTTPS         |
| 3000 |          Not public | Internal Node.js application port |

Nginx connects to the application using:

```text
http://127.0.0.1:3000
```

This means external users do not need direct access to port `3000`.

## Security Boundaries

Current security practices:

* SSH access restricted to trusted IP address
* Internal application port `3000` removed from public inbound rules
* Secrets are not committed to GitHub
* Production `.env` file is stored only on EC2
* PostgreSQL connection uses SSL configuration
* Nginx is used as the public entry point
* Session data is stored in PostgreSQL instead of application memory
* AWS Budget Alert is configured for cost control

Current limitations:

* HTTPS is not enabled yet
* Domain is not configured yet
* No Web Application Firewall is configured
* No centralized log management is configured
* Monitoring is lightweight and based on endpoints, logs, smoke tests, and AWS metrics

## Operational Checks

The application supports the following checks:

### Application Health

```text
GET /healthz
```

Purpose:

```text
Check whether the application process is alive.
```

### Application Readiness

```text
GET /readyz
```

Purpose:

```text
Check whether required environment variables and database connectivity are available.
```

### Smoke Test

```bash
npm run smoke
```

Purpose:

```text
Verify that important routes are reachable after deployment.
```

Current smoke test checks:

```text
Home page
Course search page
Course detail page
Course preview page
/healthz
/readyz
```

## Logging

Current log sources:

| Log Source              | Command or Location                                |
| ----------------------- | -------------------------------------------------- |
| Docker application logs | `docker compose logs`                              |
| Nginx access logs       | `/var/log/nginx/online-academy.access.log`         |
| Nginx error logs        | `/var/log/nginx/online-academy.error.log`          |
| AWS cost monitoring     | AWS Budget Alert                                   |
| EC2 system state        | AWS EC2 status checks and CloudWatch basic metrics |

## Current Architecture Type

The current application is a monolithic web application.

Characteristics:

* One Node.js application handles routing, UI rendering, authentication, business logic, and database access
* One deployment unit is built as a Docker image
* Docker Compose runs the application as one main service
* Supabase PostgreSQL is managed externally

This architecture is suitable for:

* Internship portfolio project
* Small to medium academic application
* Simple deployment and debugging
* Learning DevOps fundamentals

## Monolith to Microservices Consideration

The current system does not require microservices.

However, if the application grows, it could be decomposed into services such as:

| Potential Service | Responsibility                            |
| ----------------- | ----------------------------------------- |
| Auth Service      | Login, OAuth, session, account management |
| Course Service    | Course catalog, categories, course detail |
| Learning Service  | Lectures, preview logic, learning player  |
| Progress Service  | Lecture completion and learning progress  |
| Review Service    | Course ratings and comments               |
| Media Service     | Image and video upload/storage            |

This is not implemented because the current project benefits more from a simple monolithic deployment.

## CI/CD Architecture

The CI/CD layer uses GitHub Actions.

High-level flow:

```text
Developer pushes code
-> GitHub Actions CI validates dependency installation and Docker build
-> Manual CD workflow can be triggered when EC2 is running
-> GitHub Actions connects to EC2 through SSH
-> EC2 pulls latest code
-> Docker Compose rebuilds and restarts the application
-> Health and readiness checks verify deployment
```

Manual CD is used instead of automatic deployment to control cloud cost and avoid unnecessary deployments while the EC2 instance is stopped.

## Current Strengths

* Simple and understandable architecture
* Real cloud deployment on AWS EC2
* Dockerized runtime
* Nginx reverse proxy
* Health and readiness checks
* Smoke testing
* PostgreSQL-backed sessions
* Public app port restricted behind Nginx
* Clear separation between application, deployment, and operations documentation

## Future Improvements

Potential future improvements:

* Add HTTPS with Let’s Encrypt
* Add domain name
* Add Render public demo link
* Add basic uptime monitoring
* Add CloudWatch alarm for EC2 status or CPU usage
* Move legacy local course assets to Supabase Storage
* Add API documentation
* Add basic Kubernetes manifests for learning purposes
* Add observability notes for Prometheus/Grafana or ELK as future study
