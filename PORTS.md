# Port Configuration

## Current Port Settings

The application has been configured to use different ports to avoid conflicts:

### Backend Server
- **Port**: 5001
- **URL**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health
- **Configuration**: Set in `server/index.js` (defaults to 5001)

### Frontend Server
- **Port**: 3001
- **URL**: http://localhost:3001
- **API Endpoint**: Configured to connect to backend on port 5001
- **Configuration**: Set in `client/package.json` start script

## Changes Made

1. **Backend Port**: Changed from 5000 to 5001
   - Updated `server/index.js` default port
   
2. **Frontend Port**: Changed from 3000 to 3001
   - Updated `client/package.json` start script with `PORT=3001`
   
3. **API URL**: Updated to point to new backend port
   - Updated `client/src/services/api.js` to use `http://localhost:5001/api`

## Access the Application

Open your browser and navigate to: **http://localhost:3001**

## Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

## Manual Start Commands

### Backend (Terminal 1):
```bash
cd server
PORT=5001 npm run dev
```

### Frontend (Terminal 2):
```bash
cd client
PORT=3001 npm start
```

Or use the root command:
```bash
npm run dev
```

