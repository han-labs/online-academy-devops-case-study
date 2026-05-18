# Online Academy DevOps Case Study

## Overview

Online Academy is a Node.js and Express-based web application for online course learning. The application supports course browsing, course detail pages, user authentication, role-based access control, free preview lessons, student learning flow, course progress tracking, reviews, and instructor/admin course management.

This repository is maintained as a personal DevOps-focused case study. The main goal is to take an academic web application and improve it toward a production-ready deployment workflow using environment-based configuration, Docker, cloud deployment, CI/CD, health checks, smoke testing, and operational documentation.

## Project Origin

This project originally started as a group academic project for an Online Academy platform.

During the original group project, my responsibilities included:

- Led the team, planned the project structure, and managed the Git workflow
- Designed the database schema and implemented backend RESTful APIs
- Implemented role-based access control for admin, instructor, and student users

After the academic project phase, I continued improving this project independently as a DevOps and backend portfolio case study.

## Personal DevOps-Focused Improvements

My personal work in this repository focuses on improving the project from a development-stage academic application into a deployment-ready case study.

Key improvements include:

- Stabilized the course detail and learning flow
- Implemented guest free preview mode for selected lessons
- Separated guest preview access from enrolled student learning access
- Improved the learning player navigation experience
- Fixed Previous and Next lecture navigation behavior
- Preserved role-based access control between guest, student, instructor, and admin users
- Moved sensitive configuration toward environment variables
- Prepared the project for Docker, cloud deployment, CI/CD, health checks, smoke tests, and deployment documentation

## Tech Stack

### Application

- Node.js | Express.js | JavaScript | Handlebars | Bootstrap 5

### Database and Storage

- Supabase PostgreSQL
- Supabase Storage, planned for production asset handling

### DevOps and Deployment

- Docker, planned
- Docker Compose, planned
- AWS EC2 Linux, planned
- Nginx reverse proxy, planned
- GitHub Actions CI/CD, planned
- Render as backup demo environment, planned

## Current Features

### Public User

- View homepage
- Browse course catalog
- Search and filter courses
- View course detail page
- Watch free preview lessons directly inside the learning player
- Register and log in

### Student

- Enroll in courses
- Access full course learning page after enrollment
- Watch course lectures
- Navigate between lectures using Previous and Next
- Track lesson completion
- Manage watchlist
- Submit course reviews

### Instructor

- Create and manage courses
- Manage chapters and lectures
- Upload course assets
- Toggle preview availability for lectures
- View course-related information

### Admin

- Manage users
- Manage categories
- Manage courses
- Review platform data through admin pages


## Environment Variables

Create a `.env` file based on `.env.example`.

```env
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-session-secret

DB_HOST=your-database-host
DB_PORT=5432
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=postgres
DB_SSL=true

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

Do not commit `.env` to GitHub.

Secrets such as database passwords, OAuth client secrets, and session secrets must be stored only in local environment files, deployment platform environment variables, or GitHub Secrets.

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/han-labs/online-academy-devops-case-study.git
cd online-academy-devops-case-study
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```bash
cp .env.example .env
```

Then update the values inside `.env`.

### 4. Start the application

```bash
npm start
```

The application should run at:

```text
http://localhost:3000
```

## Important Local Notes

If the Supabase database password contains special characters, wrap the password in quotes inside `.env`.

Example:

```env
DB_PASSWORD="your-password-with-special-characters"
```

If the password is not quoted correctly, PostgreSQL authentication may fail.

## Security Notes

This project follows these basic security practices:

- Environment variables are used for secrets
- `.env` is excluded from Git
- OAuth credentials should not be hardcoded in source code
- Database credentials should not be committed
- Large uploaded lecture videos are excluded from Git
- Production secrets should be managed through deployment platform environment variables or GitHub Secrets

## Completed Improvements

The following improvements have been completed in this personal case study branch:

- Fixed database configuration issue related to environment variables
- Moved session secret configuration to environment variables
- Updated application port configuration to support deployment environments
- Stabilized the course detail page
- Implemented guest preview mode
- Added a clear free preview call-to-action on the course detail page
- Added preview mode banner on the learning page
- Improved the video player behavior for preview and full learning modes
- Fixed lecture navigation using direct lecture selection, Previous, and Next
- Preserved enrolled student full-learning flow
- Preserved role-based access control logic

## DevOps Roadmap

The current goal is to improve this application into a production-ready DevOps case study.

### In Progress

- Removing hardcoded OAuth credentials from source code
- Cleaning Git history before pushing to GitHub
- Preparing fallback behavior for missing images and invalid video URLs

### Planned

- Add image and video fallback handling
- Add centralized error handling
- Add `/healthz` endpoint
- Add `/readyz` endpoint
- Add smoke testing script
- Standardize Supabase Storage usage
- Add Dockerfile
- Add Docker Compose setup
- Deploy to AWS EC2 Linux
- Configure Nginx reverse proxy
- Add GitHub Actions CI workflow
- Add GitHub Actions deployment workflow
- Add deployment documentation
- Add operations runbook
- Add architecture documentation

## Planned Production Architecture

```text
User Browser
-> Nginx Reverse Proxy
-> Node.js Express Application
-> Supabase PostgreSQL
-> Supabase Storage
```

Planned deployment flow:

```text
GitHub Repository
-> GitHub Actions CI
-> Docker Build
-> AWS EC2 Deployment
-> Docker Compose
-> Nginx Reverse Proxy
-> Health Check and Smoke Test
```

## Planned DevOps Practices

This repository will include the following DevOps-related practices:

- Environment-based configuration
- Dockerized application runtime
- Docker Compose deployment
- AWS EC2 Linux server deployment
- Nginx reverse proxy
- GitHub Actions CI pipeline
- GitHub Actions deployment pipeline
- Health and readiness checks
- Post-deployment smoke testing
- Deployment runbook
- Troubleshooting documentation

## Health Check Plan

The project will include:

```text
GET /healthz
```

Expected purpose:

- Confirm that the application process is running

Planned response:

```json
{
  "status": "ok",
  "service": "online-academy"
}
```

## Readiness Check Plan

The project will include:

```text
GET /readyz
```

Expected purpose:

- Confirm that the application is ready to serve traffic
- Validate required environment variables
- Validate database connectivity

Planned response:

```json
{
  "status": "ready",
  "database": "connected"
}
```

## Smoke Test Plan

A smoke test script will be added to verify important routes after deployment.

Planned checks:

```text
/
 /courses/search
 /courses/:id
 /courses/:id/preview
 /healthz
 /readyz
```

The smoke test will be used locally and inside CI/CD.

## Git Workflow

Recommended workflow for this repository:

```bash
git checkout -b feature/name-of-change
git add .
git commit -m "type: short description"
git push origin feature/name-of-change
```

Commit message examples:

```text
fix: stabilize course preview player
feat: add health and readiness endpoints
chore: add docker setup
docs: add deployment runbook
```

## Current Status

The application currently runs locally with Node.js and Supabase PostgreSQL. The main product flow is stable enough to continue improving production readiness.

The next development focus is:

```text
1. Fallback image and video handling
2. Basic error handling
3. Health and readiness endpoints
4. Smoke testing
5. Docker and cloud deployment
```

## Limitations

Current limitations:

- Some uploaded assets are still stored locally
- Supabase Storage cleanup is not fully completed yet
- Docker setup is not added yet
- AWS EC2 deployment is not added yet
- CI/CD is not added yet
- Monitoring is limited to planned health and readiness checks
- The project is still evolving from an academic application into a DevOps case study

## Future Improvements

Planned improvements:

- Move course images, avatars, and lecture videos to Supabase Storage
- Add fallback placeholders for missing images
- Add better invalid video handling
- Add centralized Express error middleware
- Add Dockerfile and Docker Compose
- Deploy to AWS EC2
- Configure Nginx reverse proxy
- Add GitHub Actions CI/CD
- Add deployment smoke tests
- Add architecture diagrams
- Add production troubleshooting runbook

## Author

Maintained by Huynh Gia Han.

This repository is part of my personal learning and portfolio development for DevOps Intern and Backend Intern roles. My focus is on improving a Node.js application toward production readiness through application stabilization, environment-based configuration, Docker, cloud deployment, CI/CD, health checks, smoke testing, and deployment documentation.

GitHub: https://github.com/han-labs
Linkedin: https://www.linkedin.com/in/huynh-gia-han
