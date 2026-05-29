# Deployment Guide

## Overview

This document describes how the Online Academy application is deployed as a DevOps case study using Docker, AWS EC2, Nginx reverse proxy, GitHub Actions CI/CD, health checks, readiness checks, and smoke testing.

The application is a Node.js and Express web application connected to Supabase PostgreSQL. The deployment focuses on production-readiness practices for a small internship-level DevOps project.

## Key DevOps Practices Applied

* Dockerized the Node.js application with Docker and Docker Compose
* Deployed the application manually to AWS EC2 Ubuntu
* Configured Nginx as a reverse proxy in front of the application
* Restricted public access to the internal application port
* Added `/healthz` for process-level health checking
* Added `/readyz` for environment and database readiness checking
* Added smoke testing for post-deployment verification
* Replaced in-memory sessions with PostgreSQL-backed session storage
* Managed secrets through environment variables instead of source code
* Added GitHub Actions CI for build validation
* Added GitHub Actions manual CD for controlled EC2 deployment
* Used AWS Budget Alert and EC2 stop/start workflow for cost control

## Technology Stack

### Application

* Node.js
* Express.js
* JavaScript
* Handlebars
* Bootstrap 5

### Database and Storage

* Supabase PostgreSQL
* Supabase Storage, planned for production asset management

### Deployment and Operations

* Docker
* Docker Compose
* AWS EC2 Ubuntu 24.04 LTS
* Nginx
* GitHub Actions
* Health/readiness checks
* Smoke testing

## Deployment Architecture

```text
User Browser
-> EC2 Public IPv4 / Port 80
-> Nginx Reverse Proxy
-> Docker Container: Node.js Express App / Port 3000
-> Supabase PostgreSQL
```

The application runs inside a Docker container on port 3000. Public traffic does not directly access port 3000. Nginx listens on port 80 and forwards requests internally to `127.0.0.1:3000`.

## Deployment Status

Current completed deployment items:

* Local Docker deployment verified
* AWS EC2 Ubuntu server provisioned
* Docker Engine and Docker Compose installed on EC2
* Application deployed to EC2 with Docker Compose
* Nginx reverse proxy configured
* Public access through port 80 verified
* Public access to port 3000 removed from the EC2 security group
* `/healthz` verified locally, in Docker, and through EC2/Nginx
* `/readyz` verified locally, in Docker, and through EC2/Nginx
* Smoke test passed against the EC2 public endpoint
* GitHub Actions CI/CD added for build validation and manual EC2 deployment

## Local Docker Verification

The application was first verified locally with Docker Compose.

```bash
docker compose build
docker compose up
```

Health and readiness checks:

```bash
curl -i http://localhost:3000/healthz
curl -i http://localhost:3000/readyz
```

Smoke test:

```bash
npm run smoke
```

Expected result:

```text
Smoke test summary: 6/6 passed
```

## AWS EC2 Setup

The application was deployed to an AWS EC2 instance.

EC2 configuration:

| Item             | Value                   |
| ---------------- | ----------------------- |
| Region           | Asia Pacific, Singapore |
| Operating system | Ubuntu Server 24.04 LTS |
| Instance type    | t3.micro                |
| Storage          | 20 GiB gp3              |
| SSH user         | ubuntu                  |

Final inbound security group rules:

| Type  | Port | Source        | Purpose                         |
| ----- | ---: | ------------- | ------------------------------- |
| SSH   |   22 | My IP         | Server administration           |
| HTTP  |   80 | Anywhere IPv4 | Public web access through Nginx |
| HTTPS |  443 | Anywhere IPv4 | Prepared for future HTTPS setup |

The temporary public rule for port 3000 was removed after Nginx was configured successfully.

## Production Environment Variables

A production `.env` file is created directly on the EC2 server. It is not committed to GitHub.

Example structure:

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-production-session-secret

DB_HOST=your-supabase-host
DB_PORT=5432
DB_USER=your-supabase-user
DB_PASSWORD="your-supabase-password"
DB_NAME=postgres
DB_SSL=true

SESSION_STORE=postgres
COOKIE_SECURE=false
TRUST_PROXY=false

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL=http://EC2_PUBLIC_IP/auth/google/callback
```

The `.env` file permission is restricted on EC2:

```bash
chmod 600 .env
```

Current deployment uses HTTP through Nginx. When HTTPS is added later, the following values should be updated:

```env
COOKIE_SECURE=true
TRUST_PROXY=true
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback
```

## Docker Compose Deployment on EC2

The repository is cloned on EC2:

```bash
git clone https://github.com/han-labs/online-academy-devops-case-study.git
cd online-academy-devops-case-study
```

The application is started with Docker Compose:

```bash
docker compose up -d --build
```

Container status is verified with:

```bash
docker ps
```

Expected container:

```text
online-academy-app
```

## Nginx Reverse Proxy

Nginx is installed on the EC2 Ubuntu server and configured as a reverse proxy.

Nginx site configuration:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name _;

    access_log /var/log/nginx/online-academy.access.log;
    error_log /var/log/nginx/online-academy.error.log;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

Nginx configuration is validated with:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Expected result:

```text
syntax is ok
test is successful
```

## GitHub Actions CI/CD

The project uses GitHub Actions for CI/CD automation.

### CI Workflow

The CI workflow validates the project on push and pull request.

Main checks:

* Checkout source code
* Set up Node.js
* Install dependencies with `npm ci`
* Validate Docker image build

Workflow file:

```text
.github/workflows/ci.yml
```

### Manual CD Workflow

The CD workflow is manually triggered using `workflow_dispatch`.

Main deployment flow:

```text
GitHub Actions
-> SSH into EC2
-> Pull latest source code
-> Rebuild and restart Docker Compose service
-> Verify /healthz
-> Verify /readyz
```

Workflow file:

```text
.github/workflows/deploy.yml
```

The workflow uses GitHub Secrets for EC2 connection details. Production `.env` remains on the EC2 server and is not stored in GitHub.

Required secrets:

| Secret            | Purpose                                       |
| ----------------- | --------------------------------------------- |
| `EC2_HOST`        | EC2 public IP or domain                       |
| `EC2_USER`        | SSH user, usually `ubuntu`                    |
| `EC2_SSH_KEY`     | Private SSH key for GitHub Actions deployment |
| `EC2_APP_DIR`     | Application directory on EC2                  |
| `EC2_BASE_URL`    | Public endpoint for deployment verification   |
| `SMOKE_COURSE_ID` | Course ID used by smoke test                  |

The CD workflow is manual instead of automatic to control cost and avoid unnecessary EC2 deployments while the server is not always running.

## Deployment Verification

After deployment, the following checks are performed.

From EC2:

```bash
curl -i http://localhost/healthz
curl -i http://localhost/readyz
```

From local machine:

```powershell
curl.exe -i http://EC2_PUBLIC_IP/healthz
curl.exe -i http://EC2_PUBLIC_IP/readyz
```

Smoke test from local machine:

```powershell
$env:BASE_URL="http://EC2_PUBLIC_IP"
$env:SMOKE_COURSE_ID="83"
npm run smoke
```

Expected result:

```text
Smoke test summary: 6/6 passed
```

## Monitoring and Operations

Current operational checks include:

* `/healthz` for application process health
* `/readyz` for environment and database readiness
* Docker container status with `docker ps`
* Application logs with `docker compose logs`
* Nginx access and error logs
* AWS Budget Alert for cost monitoring
* Smoke test for deployment verification

Detailed troubleshooting commands are documented in `RUNBOOK.md`.

## Cost Control

The EC2 instance is not intended to run continuously during the portfolio development phase.

Cost-control practices:

* AWS Budget Alert configured
* EC2 instance stopped when not in use
* Elastic IP not used yet
* Domain and HTTPS deferred until needed
* Render planned as the public demo environment
* AWS EC2 used as a documented DevOps deployment case study

## Current Limitations

* HTTPS is not enabled yet
* Domain is not configured yet
* EC2 is not kept running continuously to control cost
* Monitoring is currently lightweight and based on health checks, readiness checks, logs, smoke tests, and AWS Budget Alert
* Supabase Storage migration is planned for future production asset handling

## Evidence

Deployment evidence should be stored under:

```text
docs/screenshots/
```

Recommended screenshots:

```text
ec2-instance-running.png
docker-ps-ec2.png
nginx-healthz.png
nginx-readyz.png
smoke-test-ec2.png
security-group-after-closing-3000.png
github-actions-ci.png
github-actions-manual-cd.png
```

Sensitive information such as account ID, public IP, email, secrets, and private keys should be hidden before committing screenshots.
