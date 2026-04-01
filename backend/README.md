# Prioramail Backend

Backend server for Prioramail with Google OAuth authentication and Gmail API integration.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API and Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
7. Copy Client ID and Client Secret

### 3. Set Up MongoDB

Install MongoDB locally or use MongoDB Atlas:
- Local: `brew install mongodb-community` (macOS)
- Atlas: Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
MONGODB_URI=mongodb://localhost:27017/prioramail
JWT_SECRET=generate_random_secret_here
SESSION_SECRET=generate_random_secret_here
```

### 5. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `GET /auth/google` - Get Google OAuth URL
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/profile` - Get user profile (requires auth)
- `POST /auth/logout` - Logout user (requires auth)

### Health Check
- `GET /health` - Server health status

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 3000) |
| GOOGLE_CLIENT_ID | Google OAuth Client ID | Yes |
| GOOGLE_CLIENT_SECRET | Google OAuth Client Secret | Yes |
| GOOGLE_REDIRECT_URI | OAuth redirect URI | Yes |
| FRONTEND_URL | Frontend application URL | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | Secret for JWT tokens | Yes |
| SESSION_SECRET | Secret for sessions | Yes |

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── config.js          # Environment configuration
│   │   └── database.js        # MongoDB connection
│   ├── controllers/
│   │   └── authController.js  # Authentication logic
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   └── User.js            # User model
│   ├── routes/
│   │   └── auth.js            # Authentication routes
│   ├── services/
│   │   └── googleAuth.js      # Google OAuth service
│   └── server.js              # Express server
├── .env.example               # Environment template
├── .gitignore
├── package.json
└── README.md
```
