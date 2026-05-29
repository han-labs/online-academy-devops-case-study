# Operations Runbook

## Project

Online Academy DevOps Case Study

This runbook provides operational commands and troubleshooting steps for running the Online Academy application on AWS EC2 with Docker Compose and Nginx.

## Current Production-like Environment

Current deployment path:

```text
User Browser
-> EC2 Public IPv4 on Port 80
-> Nginx Reverse Proxy
-> Dockerized Node.js Application on Port 3000
-> Supabase PostgreSQL
```

The internal application port `3000` is not publicly exposed through the EC2 security group. Public access goes through Nginx on port `80`.

## Quick Status Checklist

Use this checklist when checking whether the system is running correctly.

```bash
cd ~/online-academy-devops-case-study

docker ps
curl -i http://localhost:3000/healthz
curl -i http://localhost:3000/readyz
curl -i http://localhost/healthz
curl -i http://localhost/readyz
sudo nginx -t
sudo systemctl status nginx
```

Expected result:

```text
Docker container is running
/healthz returns HTTP 200
/readyz returns HTTP 200
Nginx syntax is ok
Nginx status is active (running)
```

## EC2 Access

SSH from local Windows machine:

```powershell
cd C:\Users\huynh\.ssh
ssh -i .\online-academy-key.pem ubuntu@EC2_PUBLIC_IP
```

Expected prompt:

```text
ubuntu@ip-172-xx-xx-xx:~$
```

Check server identity:

```bash
whoami
pwd
lsb_release -a
```

Expected result:

```text
ubuntu
/home/ubuntu
Ubuntu 24.04 LTS
```

## Project Directory

Application directory on EC2:

```bash
cd ~/online-academy-devops-case-study
```

Useful directory commands:

```bash
pwd
ls
ls -la
cd ~
cd ..
cd -
```

## Docker Operations

### Check Docker Version

```bash
docker --version
docker compose version
```

### Check Running Containers

```bash
docker ps
```

Expected container:

```text
online-academy-app
```

### Start Application

```bash
cd ~/online-academy-devops-case-study
docker compose up -d
```

### Rebuild and Restart Application

Use this after pulling new source code or changing Docker-related files.

```bash
cd ~/online-academy-devops-case-study
docker compose up -d --build
```

### Stop Application Container

```bash
cd ~/online-academy-devops-case-study
docker compose down
```

### View Application Logs

```bash
cd ~/online-academy-devops-case-study
docker compose logs --tail=100
```

Follow live logs:

```bash
docker compose logs -f
```

Press `Ctrl + C` to stop following logs. This does not stop the container.

## Health and Readiness Checks

### Application Direct Check

This checks the Node.js application directly through port `3000` from inside EC2.

```bash
curl -i http://localhost:3000/healthz
curl -i http://localhost:3000/readyz
```

Expected result:

```text
HTTP/1.1 200 OK
```

### Nginx Public Path Check

This checks the application through Nginx.

```bash
curl -i http://localhost/healthz
curl -i http://localhost/readyz
```

Expected result:

```text
HTTP/1.1 200 OK
```

### Local Machine Check

Run from Windows PowerShell:

```powershell
curl.exe -i http://EC2_PUBLIC_IP/healthz
curl.exe -i http://EC2_PUBLIC_IP/readyz
```

Expected result:

```text
HTTP/1.1 200 OK
```

## Smoke Test

Run from local Windows machine inside the project folder:

```powershell
cd C:\Users\huynh\Study\DevOps\online-academy

$env:BASE_URL="http://EC2_PUBLIC_IP"
$env:SMOKE_COURSE_ID="83"
npm run smoke
```

Expected result:

```text
Smoke test summary: 6/6 passed
```

Smoke test validates:

```text
Home page
Course search page
Course detail page
Course preview page
/healthz
/readyz
```

## Nginx Operations

### Check Nginx Status

```bash
sudo systemctl status nginx
```

Expected result:

```text
active (running)
```

Press `q` to exit the status screen.

### Test Nginx Configuration

```bash
sudo nginx -t
```

Expected result:

```text
syntax is ok
test is successful
```

### Reload Nginx

Use this after changing Nginx configuration.

```bash
sudo systemctl reload nginx
```

### Restart Nginx

```bash
sudo systemctl restart nginx
```

### View Nginx Logs

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

Press `Ctrl + C` to stop following logs.

## Environment Variables

The production `.env` file is stored directly on the EC2 server.

Path:

```bash
~/online-academy-devops-case-study/.env
```

Check file permission:

```bash
ls -la .env
```

Expected permission:

```text
-rw-------
```

Set secure permission:

```bash
chmod 600 .env
```

Edit `.env`:

```bash
nano .env
```

Save in nano:

```text
Ctrl + O
Enter
Ctrl + X
```

Important:

```text
Do not commit .env to GitHub.
Do not paste real secrets into README, screenshots, chat, or public documents.
```

## Deployment Update Procedure

Use this manual deployment process before GitHub Actions CD is added.

```bash
cd ~/online-academy-devops-case-study

git pull origin main
docker compose up -d --build
docker ps

curl -i http://localhost/healthz
curl -i http://localhost/readyz
```

After that, run smoke test from the local Windows machine:

```powershell
$env:BASE_URL="http://EC2_PUBLIC_IP"
$env:SMOKE_COURSE_ID="83"
npm run smoke
```

Expected result:

```text
Smoke test summary: 6/6 passed
```

## Troubleshooting

### Problem: Website does not open from browser

Check Nginx:

```bash
sudo systemctl status nginx
sudo nginx -t
```

Check app container:

```bash
cd ~/online-academy-devops-case-study
docker ps
docker compose logs --tail=100
```

Check health endpoint:

```bash
curl -i http://localhost/healthz
```

If EC2 local test works but browser does not, check AWS Security Group:

```text
HTTP port 80 should allow Anywhere IPv4.
```

### Problem: 502 Bad Gateway

This usually means Nginx is running but cannot reach the Node.js application.

Check container:

```bash
docker ps
```

Check app health directly:

```bash
curl -i http://localhost:3000/healthz
```

Check Nginx error log:

```bash
sudo tail -n 50 /var/log/nginx/online-academy.error.log
```

Common causes:

```text
Docker container is not running
Application crashed
Port 3000 is not listening
Nginx proxy_pass points to the wrong port
```

### Problem: /readyz fails

`/readyz` checks whether the application is ready to serve traffic.

Check:

```bash
cd ~/online-academy-devops-case-study
docker compose logs --tail=100
```

Common causes:

```text
Missing environment variables
Wrong database password
Supabase database connection issue
DB_SSL configuration issue
```

### Problem: Docker permission denied

If Docker command fails with permission denied:

```bash
sudo usermod -aG docker $USER
exit
```

Then SSH again.

Check:

```bash
docker ps
```

### Problem: SSH timeout

Check from local Windows machine:

```powershell
Test-NetConnection EC2_PUBLIC_IP -Port 22
```

If it fails:

```text
Check EC2 Security Group.
SSH port 22 should allow My IP.
Confirm that the EC2 public IPv4 is correct.
If EC2 was stopped and started, public IPv4 may have changed.
```

### Problem: EC2 public IP changed

If the instance is stopped and started, the public IPv4 may change.

Actions:

```text
Copy the new EC2 public IPv4 address.
Update BASE_URL when running smoke test.
Update any temporary callback URLs if needed.
Do not use an old IP address.
```

## Security Group Baseline

Current recommended inbound rules:

| Type  | Port | Source        | Purpose            |
| ----- | ---: | ------------- | ------------------ |
| SSH   |   22 | My IP         | SSH administration |
| HTTP  |   80 | Anywhere IPv4 | Public web access  |
| HTTPS |  443 | Anywhere IPv4 | Future HTTPS       |

Port `3000` should not be publicly exposed after Nginx is configured.

## Cost Control

The EC2 instance is not intended to run continuously during the portfolio development phase.

Cost-control steps:

```text
Stop EC2 when not using it.
Keep AWS Budget Alert enabled.
Avoid unnecessary services.
Do not create Elastic IP unless needed.
Do not create Load Balancer, NAT Gateway, RDS, or Kubernetes cluster for this phase.
```

Stop instance:

```text
AWS Console
-> EC2
-> Instances
-> Select online-academy
-> Instance state
-> Stop instance
```

Start instance:

```text
AWS Console
-> EC2
-> Instances
-> Select online-academy
-> Instance state
-> Start instance
```

After starting the instance again:

```text
Copy the new Public IPv4 address.
Test SSH.
Test Nginx.
Run smoke test again.
```

## Monitoring Checklist

Current lightweight monitoring approach:

```text
Application health: /healthz
Application readiness: /readyz
Container status: docker ps
Application logs: docker compose logs
Nginx logs: /var/log/nginx/
Deployment verification: npm run smoke
Cloud cost monitoring: AWS Budget Alert
EC2 basic metrics: AWS CloudWatch
```

Useful commands:

```bash
docker ps
docker compose logs --tail=100
sudo tail -n 50 /var/log/nginx/online-academy.access.log
sudo tail -n 50 /var/log/nginx/online-academy.error.log
curl -i http://localhost/healthz
curl -i http://localhost/readyz
```

## GitHub Actions CD Note

Before GitHub Actions manual CD is added, deployments are performed manually through SSH.

After GitHub Actions manual CD is added, the expected deployment flow will be:

```text
GitHub Actions
-> SSH into EC2
-> git pull origin main
-> docker compose up -d --build
-> verify /healthz
-> verify /readyz
```

The production `.env` file will remain on EC2 and will not be stored in GitHub.
