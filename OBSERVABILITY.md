# Observability Notes

## Overview

This document describes the current observability approach for the Online Academy DevOps Case Study.

The project does not use a full observability stack such as Prometheus, Grafana, ELK, or Loki yet. Instead, it applies lightweight and practical monitoring techniques suitable for a small DevOps internship portfolio project.

The current observability approach focuses on:

* application health checks
* application readiness checks
* smoke testing
* Docker logs
* Nginx access and error logs
* AWS Budget Alert
* EC2 basic metrics through AWS CloudWatch
* operational troubleshooting through `RUNBOOK.md`

## Current Observability Scope

| Area                    | Current Implementation           |
| ----------------------- | -------------------------------- |
| Application health      | `/healthz` endpoint              |
| Application readiness   | `/readyz` endpoint               |
| Deployment verification | Smoke test script                |
| Application logs        | Docker Compose logs              |
| Reverse proxy logs      | Nginx access and error logs      |
| Cloud cost monitoring   | AWS Budget Alert                 |
| Infrastructure metrics  | AWS CloudWatch basic EC2 metrics |
| Troubleshooting         | `RUNBOOK.md`                     |

## Health Check

Endpoint:

```text
GET /healthz
```

Purpose:

```text
Checks whether the application process is running.
```

Expected response:

```json
{
  "status": "ok",
  "service": "online-academy",
  "environment": "production"
}
```

Example command:

```bash
curl -i http://localhost/healthz
```

Expected result:

```text
HTTP/1.1 200 OK
```

## Readiness Check

Endpoint:

```text
GET /readyz
```

Purpose:

```text
Checks whether the application is ready to serve traffic.
```

The readiness check validates:

* required environment configuration
* database connectivity

Expected response:

```json
{
  "status": "ready",
  "service": "online-academy",
  "environment": "production",
  "checks": {
    "env": {
      "status": "pass"
    },
    "database": {
      "status": "pass"
    }
  }
}
```

Example command:

```bash
curl -i http://localhost/readyz
```

Expected result:

```text
HTTP/1.1 200 OK
```

## Smoke Testing

Smoke tests are used after deployment to verify that important routes are reachable.

Command:

```bash
npm run smoke
```

The smoke test verifies:

* home page
* course search page
* course detail page
* course preview page
* `/healthz`
* `/readyz`

Expected result:

```text
Smoke test summary: 6/6 passed
```

For EC2 deployment verification:

```powershell
$env:BASE_URL="http://EC2_PUBLIC_IP"
$env:SMOKE_COURSE_ID="83"
npm run smoke
```

For Render live demo verification:

```powershell
$env:BASE_URL="https://online-academy-hnnq.onrender.com"
$env:SMOKE_COURSE_ID="83"
npm run smoke
```

## Docker Logs

Application logs are collected through Docker Compose.

View recent logs:

```bash
cd ~/online-academy-devops-case-study
docker compose logs --tail=100
```

Follow logs live:

```bash
docker compose logs -f
```

Use Docker logs to investigate:

* application startup issues
* environment variable issues
* database connection failures
* runtime errors
* route-level errors

## Nginx Logs

Nginx is used as the reverse proxy in the EC2 deployment.

Access log:

```bash
sudo tail -n 50 /var/log/nginx/online-academy.access.log
```

Error log:

```bash
sudo tail -n 50 /var/log/nginx/online-academy.error.log
```

Follow logs live:

```bash
sudo tail -f /var/log/nginx/online-academy.access.log
sudo tail -f /var/log/nginx/online-academy.error.log
```

Use Nginx logs to investigate:

* 502 Bad Gateway errors
* failed proxy requests
* public request traffic
* reverse proxy issues
* HTTP access patterns

## GitHub Actions Deployment Verification

The manual CD workflow verifies deployment after rebuilding and restarting the Docker Compose service.

Verification flow:

```text
GitHub Actions
-> Self-hosted runner on EC2
-> Pull latest main branch
-> Rebuild Docker Compose service
-> Check /healthz
-> Check /readyz
```

The deployment workflow includes retry logic to wait for the application to become healthy before marking the deployment as successful.

## AWS Budget Alert

AWS Budget Alert is used for cloud cost monitoring.

Purpose:

```text
Prevent unexpected cloud spending while using EC2 for portfolio deployment and testing.
```

Current cost-control approach:

* EC2 is stopped when not in use
* EC2 is not kept running continuously
* Elastic IP is not used yet
* Domain and HTTPS are deferred
* Render is used as the stable public live demo
* EC2 is used as a documented DevOps deployment case study

## AWS CloudWatch Basic Metrics

AWS EC2 provides basic CloudWatch metrics that can be used to observe the instance.

Useful metrics:

| Metric               | Purpose                               |
| -------------------- | ------------------------------------- |
| CPUUtilization       | Check CPU usage                       |
| NetworkIn            | Check inbound traffic                 |
| NetworkOut           | Check outbound traffic                |
| StatusCheckFailed    | Check EC2 instance health             |
| Disk-related metrics | Available with additional agent setup |

Current project scope uses basic EC2 metrics only. Advanced CloudWatch alarms are considered a future improvement.

## Troubleshooting Entry Points

When the system has an issue, start with these checks:

```bash
docker ps
docker compose logs --tail=100
sudo nginx -t
sudo systemctl status nginx
curl -i http://localhost/healthz
curl -i http://localhost/readyz
sudo tail -n 50 /var/log/nginx/online-academy.error.log
```

Common issue mapping:

| Symptom                 | First Check                                   |
| ----------------------- | --------------------------------------------- |
| Website does not open   | Security Group, Nginx status                  |
| 502 Bad Gateway         | Docker container, app health, Nginx error log |
| `/readyz` fails         | Database connection, environment variables    |
| GitHub Actions CD fails | Runner status, Docker logs, readiness check   |
| Smoke test fails        | Public endpoint, route availability, app logs |
| Login/session issue     | Session store, cookie settings, trust proxy   |

## Current Limitations

The current observability setup is intentionally lightweight.

Not implemented yet:

* Prometheus
* Grafana
* ELK stack
* Loki
* Uptime Kuma
* CloudWatch alarms
* centralized logging
* distributed tracing

These tools are not required for the current internship-level case study, but they are listed as future learning directions.

## Future Improvements

Possible future observability improvements:

* Add CloudWatch alarm for EC2 status check failure
* Add CloudWatch alarm for high CPU usage
* Add uptime monitoring for `/healthz`
* Add structured application logging
* Add request logging middleware
* Add Prometheus and Grafana learning demo
* Add ELK or Loki learning notes
* Add alerting workflow for deployment failure
