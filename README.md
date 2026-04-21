# CNC7drawCODE

Sketch with js for CNC paths.

This project can be run in two ways:
1. **As a Desktop Application:** Using Electron.
2. **As a Web Application:** Using a FastAPI backend server via Docker.

## 1. Run as a Desktop Application (Electron)

Make sure you have Node.js installed.

```bash
# Install dependencies
npm install

# Start the desktop app
npm start
```

## 2. Run as a Web Application (Docker)

Make sure you have Docker installed and Docker Compose.

```bash
# Build and start the backend/web server
docker-compose up -d --build
```

You can then view the application in your browser at:
`http://localhost:8000/`

Changes in the code (both `/src` and `/backend`) will hot-reload automatically. 
