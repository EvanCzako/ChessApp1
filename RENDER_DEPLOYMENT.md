# Render Deployment Guide for Chess App

## Prerequisites
- GitHub account with the Chess app repository
- Render account (free tier available)

## Deployment Steps

### 1. Stockfish Setup (IMPORTANT)
Render uses Linux, so you need to install `stockfish`:

**Option A: Using npm package (Recommended)**
```bash
cd backend
npm install stockfish
```

**Option B: Use system package (via Dockerfile)**
Create a `backend/.dockerignore` and ensure `stockfish` is available.

### 2. Update Environment Variables in Frontend
The frontend will detect the backend URL via the `REACT_APP_API_URL` environment variable. Update `src/utils/stockfishEval.ts` to use:
```typescript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

### 3. Prepare Backend for Production
The backend now uses `process.env.PORT` and cross-platform Stockfish detection.

### 4. Deploy via render.yaml
The `render.yaml` file defines:
- **Backend service**: Node.js, runs on port 3001
- **Frontend service**: Static site, serves built React app

### 5. Manual Dashboard Setup (If not using render.yaml)

#### Option A: Single Repo (Recommended)
1. Connect your repository to Render
2. Create two services:

**Service 1: Backend**
- Name: `chess-backend`
- Type: Web Service
- Environment: Node
- Build Command: `cd backend && npm install`
- Start Command: `cd backend && npm start`
- Port: 3001
- Environment Variables:
  - `NODE_ENV`: `production`
  - `PORT`: `3001`

**Service 2: Frontend**
- Name: `chess-frontend`
- Type: Static Site
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variables:
  - `REACT_APP_API_URL`: `https://chess-backend.onrender.com`

#### Option B: Monorepo with Custom Dockerfile
Create a `Dockerfile` in root:
```dockerfile
FROM node:18-alpine

# Install Stockfish
RUN apk add --no-cache stockfish

WORKDIR /app

# Copy root package files
COPY package*.json ./
RUN npm install

# Copy backend
COPY backend ./backend
WORKDIR /app/backend
RUN npm install

WORKDIR /app

# Build frontend
COPY src ./src
COPY vite.config.ts tsconfig*.json index.html ./
RUN npm run build

# Expose backend port
EXPOSE 3001

# Start backend
CMD ["node", "backend/index.js"]
```

### 6. Important Configuration Notes

**CORS Configuration**
The backend must allow requests from your frontend domain:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

**Build Time Considerations**
- Free tier has limited build time (15 minutes)
- If npm install takes too long, consider using a more minimal setup

**Stockfish Binary**
- On Render (Linux), the `stockfish` command must be available
- Use `npm install stockfish` to get binary, or
- Use APK/apt package manager in Dockerfile

## Testing Locally
Before deploying, test the configuration:
```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
export REACT_APP_API_URL=http://localhost:3001
npm run dev
```

## Troubleshooting

**Frontend can't reach backend**
- Check `REACT_APP_API_URL` environment variable
- Ensure backend is running and accessible
- Check CORS settings in `backend/index.js`

**Stockfish not found**
- Add `stockfish` package to [backend/package.json](backend/package.json)
- Or use Dockerfile with `apk add stockfish`

**Build fails**
- Check free tier resource limits
- Ensure all dependencies are in package.json
- Check build logs on Render dashboard

## Next Steps
1. Update [backend/package.json](backend/package.json) to include `stockfish` package
2. Test locally with environment variables
3. Push to GitHub
4. Connect repository to Render
5. Deploy using [render.yaml](render.yaml) or manual setup
