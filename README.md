# Call Manager - Outreach Team Management System

A full-stack call management system for outreach teams to manage contacts and track call activities.

## Features

- **User Authentication**: Secure login system with JWT tokens
- **Contact Management**: Upload contacts with name, number, and address
- **Call Assignment**: Request numbers from the contact pool
- **Status Tracking**: Update call status (pending, in-progress, completed, etc.)
- **Comments**: Add notes and comments to call records

## Tech Stack

### Backend
- Node.js with Express
- SQLite database
- JWT authentication
- bcryptjs for password hashing

### Frontend
- React
- Modern UI with responsive design

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables:**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   JWT_SECRET=your-secret-key-change-in-production
   ```

### Running the Application

**Option 1: Run both server and client together (recommended)**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm start
```

### Default Login Credentials

- **Username:** `admin`
- **Password:** `admin123`

⚠️ **Important:** Change the default password in production!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user

### Contacts
- `GET /api/contacts` - Get all contacts (with assignment status)
- `GET /api/contacts/available` - Get available contacts (not assigned)
- `POST /api/contacts` - Upload single contact
- `POST /api/contacts/bulk` - Bulk upload contacts
- `GET /api/contacts/:id` - Get contact by ID

### Calls
- `POST /api/calls/request` - Request a number from the pool
- `GET /api/calls/my-calls` - Get user's assigned calls
- `GET /api/calls` - Get all call records
- `PUT /api/calls/:id` - Update call status and comments
- `GET /api/calls/:id` - Get call record by ID

## Database Schema

### Users
- id, username, password, created_at

### Contacts
- id, name, number, address, uploaded_by, uploaded_at

### Call Records
- id, contact_id, user_id, status, comments, requested_at, updated_at

## Project Structure

```
Call Manager/
├── server/
│   ├── database/
│   │   └── init.js          # Database initialization
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── contacts.js      # Contact management routes
│   │   └── calls.js         # Call management routes
│   ├── index.js             # Express server entry point
│   └── package.json
├── client/
│   └── (React frontend files)
├── package.json
└── README.md
```

## Development

The backend server runs on `http://localhost:5000` and the React frontend runs on `http://localhost:3000`.

The database file (`callmanager.db`) will be automatically created in the `server/database/` directory on first run.

