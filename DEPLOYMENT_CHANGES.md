# Render Deployment: Summary of Changes

This document summarizes all modifications made to prepare the Chess app for Render deployment.

## Files Created

### 1. **render.yaml**
Defines two services:
- **chess-backend**: Node.js service running the Express server on port 3001
- **chess-frontend**: Static site serving the built React app
Environment variables are configured to point services to each other.

### 2. **Dockerfile**
Alternative single-container deployment that:
- Uses Alpine Linux + Node.js
- Installs Stockfish binary
- Builds the frontend
- Serves both backend API and frontend static files

### 3. **Procfile**
For Heroku-style deployments (can also be used with Render).

### 4. **.dockerignore**
Specifies files to exclude from Docker builds.

### 5. **.env.example**
Documents required environment variables:
- `REACT_APP_API_URL`: Backend API URL (for frontend builds)
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

### 6. **.env.production**
Vite configuration file for production builds.

### 7. **RENDER_DEPLOYMENT.md**
Comprehensive deployment guide with step-by-step instructions.

## Files Modified

### 1. **backend/index.js**
**Changes:**
- Added imports: `path`, `fileURLToPath`, `os`
- PORT now uses `process.env.PORT || 3001`
- New `getStockfishPath()` function for cross-platform support:
  - Windows: Uses local path
  - macOS: `/usr/local/bin/stockfish`
  - Linux: Uses `stockfish` command (from npm package)
- Updated CORS configuration to accept environment variables
- Added static file serving to host the frontend build
- Added catch-all route for SPA routing

### 2. **src/utils/stockfishEval.ts**
**Changes:**
- API_URL now uses `process.env.REACT_APP_API_URL` environment variable
- Falls back to `http://localhost:3001` for development

### 3. **backend/package.json**
**Changes:**
- Added `"stockfish": "^14.0.0"` to dependencies
- This provides the Stockfish binary for Linux/Render environments

## Deployment Options

### Option 1: render.yaml (Recommended for Render)
Uses the provided `render.yaml` file:
```bash
git push origin main
# On Render dashboard: Connect repo and use render.yaml
```

**Pros:**
- Native Render format
- Two separate services (backend + frontend)
- Automatic deployment from git

**Cons:**
- More complex configuration
- Two separate service instances

---

### Option 2: Single-Service Docker Deployment
Uses the `Dockerfile`:
```bash
# On Render dashboard:
# 1. Set build command: docker build -t chess .
# 2. Set start command: node backend/index.js
# 3. Set port: 3001
```

**Pros:**
- Single service/instance
- More control over environment
- Efficiently uses resources

**Cons:**
- Slightly more complex setup

---

### Option 3: Heroku/Render Web Service
Uses the `Procfile`:
```bash
# On Render dashboard: Select "Node.js" service
# Build command: npm install && cd backend && npm install
# Start command: npm run build && node backend/index.js
```

**Pros:**
- Simple configuration
- Good for small deployments

**Cons:**
- May not include Stockfish by default
- Limited customization

---

## Environment Variables to Configure

### On Render Dashboard:

#### For Backend Service:
```
PORT=3001
NODE_ENV=production
```

#### For Frontend Service (if separate):
```
REACT_APP_API_URL=https://chess-backend.onrender.com
```

#### For Single Service:
The backend will automatically serve the frontend after build.

---

## Key Configuration Details

### Stockfish Engine
- **On Render (Linux):** `npm install stockfish` provides the binary
- **On Windows:** Uses local path `C:\Code\stockfish\...`
- **On macOS:** Uses `/usr/local/bin/stockfish`

### CORS Settings
The backend accepts requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3001` (local backend)
- Configured via `FRONTEND_URL` env variable for production

### Frontend Build
- Build command: `npm install && npm run build`
- Output: `dist/` directory
- Backend serves static files from `../dist`

### SPA Routing
- The backend's catch-all route handles all front-end routing
- API routes are protected by checking `/api/` prefix

---

## Testing Before Deployment

```bash
# Test backend
cd backend
npm install
npm start

# Test frontend (in another terminal)
export REACT_APP_API_URL=http://localhost:3001
npm run dev
```

---

## Troubleshooting

### Build Fails on Render
- Check build logs: Render Dashboard → Service → Logs
- Ensure Node.js version compatibility
- Check that all `npm install` steps complete

### Frontend Can't Reach Backend
- Verify `REACT_APP_API_URL` environment variable is set correctly
- Check backend is running on Render
- Verify CORS configuration in [backend/index.js](backend/index.js)

### Stockfish Binary Not Found
- Added to [backend/package.json](backend/package.json) dependencies
- For Docker: Ensure `apk add stockfish` runs during build

### Port Issues
- Render dynamically assigns ports
- Backend reads from `process.env.PORT`
- Already configured in updated [backend/index.js](backend/index.js)

---

## Next Steps

1. **Install Stockfish package:**
   ```bash
   cd backend && npm install
   ```

2. **Test locally:**
   ```bash
   npm run dev:all
   ```

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Setup for Render deployment"
   git push
   ```

4. **Deploy on Render:**
   - Create new Web Service
   - Choose deployment method (render.yaml or manual)
   - Set environment variables
   - Deploy

---

## Resources

- [Render Docs](https://render.com/docs)
- [Render Native Environments](https://render.com/docs/native-environments)
- [Environment Variables on Render](https://render.com/docs/environment-variables)
- [Docker Deployments](https://render.com/docs/deploy-docker)

