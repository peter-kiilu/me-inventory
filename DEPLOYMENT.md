# Deployment Guide

This guide covers deploying the MeStock Inventory Management System to production and installing it on mobile devices.

## Table of Contents

1. [Backend Deployment](#backend-deployment)
2. [Frontend Deployment](#frontend-deployment)
3. [Mobile Installation](#mobile-installation)
4. [Environment Variables](#environment-variables)
5. [Production Checklist](#production-checklist)

## Backend Deployment

### Option 1: Railway.app (Recommended)

1. **Create Railway Account**

   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Initialize project
   cd backend
   railway init

   # Deploy
   railway up
   ```

3. **Set Environment Variables**

   - In Railway dashboard, go to your project
   - Add environment variables (see section below)

4. **Run Database Migration**
   ```bash
   railway run python seed_data.py
   ```

### Option 2: Render.com

1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

### Option 3: VPS (DigitalOcean, AWS, etc.)

```bash
# SSH into your server
ssh user@your-server-ip

# Install Python and dependencies
sudo apt update
sudo apt install python3.10 python3.10-venv nginx

# Clone repository
git clone your-repo-url
cd mestock/backend

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create systemd service
sudo nano /etc/systemd/system/mestock.service
```

**Systemd Service File:**

```ini
[Unit]
Description=MeStock Inventory API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/mestock/backend
Environment="PATH=/path/to/mestock/backend/venv/bin"
ExecStart=/path/to/mestock/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl start mestock
sudo systemctl enable mestock

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/mestock
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Frontend Deployment

### Option 1: Netlify (Recommended for PWA)

1. **Build the application**

   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**

   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login
   netlify login

   # Deploy
   netlify deploy --prod --dir=dist
   ```

3. **Configure Netlify**
   - Add `_redirects` file in `public/`:
   ```
   /api/*  https://your-backend-url.com/api/:splat  200
   /*    /index.html   200
   ```

### Option 2: Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Run `vercel` in frontend directory
3. Follow prompts
4. Configure environment variables in Vercel dashboard

### Option 3: GitHub Pages

1. **Build**

   ```bash
   npm run build
   ```

2. **Deploy**

   ```bash
   # Install gh-pages
   npm install -D gh-pages

   # Add to package.json scripts:
   "deploy": "gh-pages -d dist"

   # Deploy
   npm run deploy
   ```

## Mobile Installation

### Android Installation

#### Method 1: Through Browser

1. Open Chrome browser on Android
2. Navigate to your deployed app URL
3. Tap the menu (⋮) in the top right
4. Select "Install app" or "Add to Home screen"
5. Follow the prompts
6. App will appear on home screen

#### Method 2: Generate APK with PWA Builder

1. Go to [PWABuilder.com](https://www.pwabuilder.com/)
2. Enter your PWA URL
3. Click "Build My PWA"
4. Select "Android" and download APK
5. Transfer APK to phone
6. Install (enable "Unknown sources" in settings)

### iOS Installation

1. Open Safari on iPhone/iPad
2. Navigate to your deployed app URL
3. Tap the Share button (square with arrow)
4. Scroll and tap "Add to Home Screen"
5. Name the app "MeStock"
6. Tap "Add"
7. App icon appears on home screen

### Desktop Installation

#### Windows/Mac/Linux (Chrome/Edge)

1. Open app in Chrome or Edge
2. Look for install icon in address bar
3. Click "Install"
4. App opens in standalone window

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=sqlite:///./inventory.db

# Security
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Default PIN (hashed in code)
DEFAULT_PIN=1234

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://your-frontend-url.com,https://www.your-frontend-url.com
```

### Frontend (.env.production)

```env
VITE_API_URL=https://your-backend-url.com/api
```

## Production Checklist

### Security

- [ ] Change default PIN in `backend/auth.py`
- [ ] Use strong `SECRET_KEY` in environment variables
- [ ] Enable HTTPS (use Let's Encrypt for free SSL)
- [ ] Configure CORS to allow only your frontend domain
- [ ] Set secure cookie flags if using session auth
- [ ] Implement rate limiting for API endpoints

### Performance

- [ ] Enable Gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure database connection pooling
- [ ] Add caching headers for static files
- [ ] Optimize images and assets
- [ ] Minify JavaScript and CSS (done by Vite)

### Monitoring

- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Configure uptime monitoring
- [ ] Set up database backups
- [ ] Monitor API response times
- [ ] Track PWA install metrics

### Testing

- [ ] Test offline functionality
- [ ] Test sync when connection restored
- [ ] Test on different devices and browsers
- [ ] Verify PWA installation on Android/iOS
- [ ] Test POS API integration
- [ ] Load test with multiple concurrent users

### Database

- [ ] Regular backups (daily recommended)
- [ ] Set up backup rotation
- [ ] Test restore procedure
- [ ] Consider migrating to PostgreSQL for production

## Transferring to Client's Phone

### Easiest Method: Share URL

1. **Deploy the app** to Netlify/Vercel
2. **Share the URL** with client via:

   - SMS
   - Email
   - QR Code (generate at qr-code-generator.com)

3. **Client installs** following Android/iOS instructions above

### Alternative: APK Distribution

1. **Generate APK** using PWABuilder
2. **Upload APK** to Google Drive or Dropbox
3. **Share link** with client
4. **Client downloads** and installs

### For Multiple Clients

1. **Create landing page** with:

   - Install instructions
   - QR code
   - Direct install button

2. **Example landing page**:
   ```html
   <h1>Install MeStock</h1>
   <div id="pwa-install-button">Install App</div>
   <img src="qr-code.png" alt="Scan to install" />
   <p>Or visit: https://your-app-url.com</p>
   ```

## Updating the App

### Backend Updates

```bash
# Pull latest code
git pull

# Restart service
sudo systemctl restart mestock
```

### Frontend Updates

```bash
# Build new version
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### PWA Cache Update

- Users will automatically get updates when they reload
- Service worker caches new version
- Can implement update notification in UI

## Troubleshooting Deployment

### Issue: CORS Errors

**Solution**: Update `ALLOWED_ORIGINS` in backend to include frontend URL

### Issue: PWA not installing

**Solution**:

- Check manifest.json is accessible
- Verify service worker is registered
- Ensure HTTPS is enabled
- Check browser console for errors

### Issue: Offline mode not working

**Solution**:

- Clear browser cache
- Reinstall PWA
- Check service worker registration
- Verify IndexedDB is working

### Issue: Database locked

**Solution**:

- Ensure only one backend instance running
- Consider migrating to PostgreSQL

## Support

For deployment issues:

1. Check logs: `railway logs` or `sudo journalctl -u mestock`
2. Verify environment variables
3. Test API endpoints: `https://your-api-url.com/docs`
4. Check browser console for frontend errors

---

**Ready to deploy? Follow this guide step by step and your app will be live!** 🚀
