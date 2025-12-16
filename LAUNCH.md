# Launch Instructions

## ✅ Dependencies Installed

All dependencies have been installed for:
- Root project (concurrently)
- Backend server (Express, SQLite, JWT, etc.)
- Frontend client (React, React Router, Axios)

## 🚀 Application Status

The application has been launched with both servers running:

### Backend Server
- **Status**: Running in background
- **URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **Database**: SQLite (auto-created at `server/database/callmanager.db`)

### Frontend Server
- **Status**: Running in background  
- **URL**: http://localhost:3000
- **Auto-opens**: Browser should open automatically

## 📝 Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

## 🎯 Quick Start

1. Open your browser and navigate to: **http://localhost:3000**
2. Login with the default credentials above
3. Start using the Call Manager!

## 📋 Available Features

### Dashboard (`/dashboard`)
- Main landing page with navigation
- Quick access to all features

### Upload Contacts (`/contacts`)
- Single contact upload (Name, Number, Address)
- Bulk upload (CSV format)
- View all uploaded contacts

### Manage Calls (`/calls`)
- Request numbers from available pool
- View your assigned calls
- Update call status (pending, in-progress, completed, etc.)
- Add comments to calls

## 🛠️ Manual Start (if needed)

If you need to restart the servers manually:

### Option 1: Run both together
```bash
npm run dev
```

### Option 2: Run separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

## 🔧 Troubleshooting

### Backend not starting?
- Check if port 5000 is available
- Verify database permissions in `server/database/`
- Check server logs for errors

### Frontend not starting?
- Check if port 3000 is available
- Verify all dependencies are installed: `cd client && npm install`
- Check browser console for errors

### Can't login?
- Verify backend is running on port 5000
- Check browser console for API errors
- Ensure CORS is enabled (should be automatic)

## 📊 API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Upload single contact
- `POST /api/contacts/bulk` - Bulk upload contacts
- `GET /api/contacts/available` - Get available contacts
- `POST /api/calls/request` - Request a number
- `GET /api/calls/my-calls` - Get user's calls
- `PUT /api/calls/:id` - Update call status

## ✨ Next Steps

1. The app should be accessible at http://localhost:3000
2. Login and start uploading contacts
3. Request numbers and manage your calls!

Enjoy using Call Manager! 🎉

