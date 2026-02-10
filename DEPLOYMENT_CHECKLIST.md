# Render Deployment Checklist

## Pre-Deployment (Local Setup)

- [ ] Update `backend/package.json` - stockfish dependency added
- [ ] Run `npm install` in root
- [ ] Run `npm install` in `backend/`
- [ ] Test locally: `npm run dev:all`
  - Frontend should be at `http://localhost:5173`
  - Backend API at `http://localhost:3001`
  - Try evaluating a position to test Stockfish

## Git Preparation

- [ ] Verify all changes are committed:
  ```bash
  git status
  git add .
  git commit -m "Setup for Render deployment"
  ```
- [ ] Push to GitHub:
  ```bash
  git push origin main
  ```

## Render Dashboard Setup

### Option 1: Using render.yaml (Recommended)

- [ ] Go to https://dashboard.render.com
- [ ] Click "New" → "Blueprint"
- [ ] Select your GitHub repository
- [ ] Select branch (usually `main`)
- [ ] Render will auto-detect `render.yaml`
- [ ] Review services:
  - Backend (chess-backend)
  - Frontend (chess-frontend)
- [ ] Click "Deploy"
- [ ] Wait for both services to build and deploy

### Option 2: Manual Setup (Two Services)

**Create Backend Service:**
- [ ] "New" → "Web Service"
- [ ] Select repository and branch
- [ ] Name: `chess-backend`
- [ ] Environment: `Node`
- [ ] Build Command: `cd backend && npm install`
- [ ] Start Command: `cd backend && npm start`
- [ ] Region: Choose closest to your location
- [ ] Instance Type: `Free` (for testing)
- [ ] Add Environment Variables:
  - [ ] `PORT` = `3001`
  - [ ] `NODE_ENV` = `production`
- [ ] Click "Deploy Web Service"

**Create Frontend Service:**
- [ ] After backend is running, click "New" → "Static Site"
- [ ] Select same repository and branch
- [ ] Name: `chess-frontend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `dist`
- [ ] Add Environment Variable:
  - [ ] `REACT_APP_API_URL` = (copy the backend URL from chess-backend service)
- [ ] Click "Deploy"

### Option 3: Single Docker Service

- [ ] Create new "Web Service"
- [ ] Set Runtime: `Docker`
- [ ] Build Command: `docker build -t chess .`
- [ ] Start Command: `node backend/index.js`
- [ ] Port: `3001`
- [ ] Add Environment Variables:
  - [ ] `NODE_ENV` = `production`

## Post-Deployment

- [ ] Wait for both services to deploy (5-10 minutes)
- [ ] Check backend service logs:
  - [ ] Should see "Server running on..."
  - [ ] Should see "Stockfish initialized"
  - [ ] Should see "Initializing Stockfish..."
- [ ] Check frontend service logs:
  - [ ] Should see build completed
  - [ ] Should show deployment URL
- [ ] Access frontend URL in browser
- [ ] Test functionality:
  - [ ] Move a piece on the board
  - [ ] Check that evaluation scores appear
  - [ ] Navigate through moves
  - [ ] Check console for errors

## Troubleshooting

**Backend won't start:**
- [ ] Check logs for errors
- [ ] Ensure `npm install` succeeded
- [ ] Verify Stockfish binary is available
- [ ] Check PORT environment variable

**Frontend shows blank page:**
- [ ] Check browser console for API errors
- [ ] Verify `REACT_APP_API_URL` is correct
- [ ] Check backend URL from Render dashboard
- [ ] Ensure CORS is configured

**Stockfish not working:**
- [ ] Check backend logs for Stockfish errors
- [ ] Verify `stockfish` package is installed
- [ ] Try re-deploying backend service

**Frontend can't reach backend:**
- [ ] Get backend service URL from Render dashboard
- [ ] Update frontend `REACT_APP_API_URL` environment variable
- [ ] Redeploy frontend service
- [ ] Clear browser cache and refresh

## Performance Tips

- [ ] Use free tier for testing/development
- [ ] Upgrade to paid tier for production (auto-scaling)
- [ ] Monitor startup times in logs
- [ ] Set appropriate Stockfish depth in frontend

## Custom Domain (Optional)

- [ ] Go to Service Settings → Custom Domains
- [ ] Add your domain
- [ ] Update DNS records as shown by Render
- [ ] SSL certificate auto-provisioned

---

**Support:** See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for detailed instructions
