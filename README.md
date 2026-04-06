# PrioraMail 📧

> Your inbox, reimagined. A smart email client that helps you focus on what matters.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://prioramail.vercel.app)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

## 🌟 Features

- **Smart Email Categorization** - Automatically sorts emails by priority (Focus, Later, Verification, Receipts, etc.)
- **Rich Text Composer** - Full-featured email editor with formatting, images, and attachments
- **Draft Management** - Save, edit, and send drafts seamlessly
- **Attachment Support** - Preview images, download files, and attach multiple files
- **Clean Interface** - Minimal design for maximum productivity
- **Secure OAuth** - Google OAuth 2.0 authentication
- **Real-time Sync** - Direct Gmail API integration, no data storage
- **Responsive Design** - Works perfectly on desktop and mobile

## 🚀 Live Demo

Visit [https://prioramail.vercel.app](https://prioramail.vercel.app) to try it out!

## 🛠️ Tech Stack

### Frontend
- **HTML5, CSS3, Vanilla JavaScript** - No frameworks, pure performance
- **Responsive Design** - Mobile-first approach
- **Custom Animations** - Smooth transitions and interactions

### Backend
- **Node.js + Express.js** - RESTful API server
- **MongoDB + Mongoose** - User data and session management
- **Gmail API** - Email operations (read, send, modify, drafts)
- **Google OAuth 2.0** - Secure authentication
- **JWT** - Token-based session management

### Deployment
- **Vercel** - Serverless deployment for both frontend and backend
- **MongoDB Atlas** - Cloud-hosted database

## 📋 Prerequisites

- Node.js (v20 or higher)
- MongoDB Atlas account
- Google Cloud Console project with Gmail API enabled
- Vercel account (for deployment)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/imaryannn/prioramail.git
cd prioramail
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in the `backend` directory:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5500

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_random_jwt_secret

# Session Secret
SESSION_SECRET=your_random_session_secret

# Environment
NODE_ENV=development
PORT=3000
```

### 3. Frontend Setup

Update `frontend/app.js` line 34:

```javascript
const API_URL = 'http://localhost:3000';
```

### 4. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable **Gmail API**
4. Create **OAuth 2.0 Client ID** credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://your-backend.vercel.app/auth/google/callback` (production)
6. Add authorized JavaScript origins:
   - `http://localhost:5500` (development)
   - `https://your-frontend.vercel.app` (production)
7. Configure OAuth consent screen with app details

### 5. Run Locally

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
# Use any static server, e.g., Live Server in VS Code
# Or use: python -m http.server 5500
```

Visit `http://localhost:5500` in your browser.

## 🚢 Deployment

### Deploy to Vercel

#### Backend Deployment

1. Create `vercel.json` in `backend` folder:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

2. Deploy:

```bash
cd backend
vercel --prod
```

3. Add environment variables in Vercel Dashboard:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (your Vercel backend URL + `/auth/google/callback`)
   - `FRONTEND_URL` (your Vercel frontend URL)
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `NODE_ENV=production`

#### Frontend Deployment

1. Update `frontend/app.js` with your backend URL:

```javascript
const API_URL = 'https://your-backend.vercel.app';
```

2. Deploy:

```bash
cd frontend
vercel --prod
```

3. Update Google OAuth redirect URIs with production URLs

## 📁 Project Structure

```
prioramail/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── config.js          # Environment configuration
│   │   │   └── database.js        # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js  # Authentication logic
│   │   │   ├── emailController.js # Email operations
│   │   │   ├── sendEmailController.js # Send email logic
│   │   │   └── draftController.js # Draft management
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT authentication middleware
│   │   ├── models/
│   │   │   └── User.js            # User schema
│   │   ├── routes/
│   │   │   ├── auth.js            # Auth routes
│   │   │   └── emails.js          # Email routes
│   │   ├── services/
│   │   │   ├── googleAuth.js      # Google OAuth service
│   │   │   └── gmailService.js    # Gmail API service
│   │   └── server.js              # Express app entry point
│   ├── package.json
│   └── .env
├── frontend/
│   ├── index.html                 # Main HTML file
│   ├── app.js                     # Application logic
│   ├── styles.css                 # Styling
│   ├── scroll.js                  # Scroll animations
│   ├── liquid-glass.js            # Visual effects
│   ├── privacy.html               # Privacy policy
│   └── terms.html                 # Terms of service
└── README.md
```

## 🔐 Security

- **OAuth 2.0** - Secure Google authentication
- **JWT Tokens** - Encrypted session management
- **HTTPS Only** - All communication encrypted in production
- **CORS Protection** - Whitelist allowed origins
- **No Email Storage** - Privacy-first approach, emails fetched in real-time
- **Environment Variables** - Sensitive data protected

## 🎯 Key Features Explained

### Email Categorization
Uses keyword-based algorithm to automatically categorize emails into:
- **Focus** - Important, urgent emails
- **Later** - Can be handled later
- **Verification** - OTP codes, verification emails
- **Receipts** - Orders, invoices, payments
- **Newsletters** - Subscriptions, updates
- **Promotions** - Marketing, offers
- **Social** - Social media notifications
- **Updates** - App notifications, alerts
- **Spam** - Suspicious emails

### Rich Text Editor
- Bold, italic, underline formatting
- Bullet and numbered lists
- Link insertion
- Image embedding
- File attachments (multiple files supported)
- Dynamic CC/BCC fields

### Draft Management
- Save drafts with all fields (To, CC, BCC, Subject, Body)
- Edit existing drafts
- Automatic draft deletion after sending

### Attachment Handling
- Preview images inline
- Download any file type
- Support for multiple attachments
- Proper MIME type handling

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited without explicit permission from the author.

## 👨‍💻 Author

**Aryan**
- Email: thatsaryn@gmail.com
- GitHub: [@imaryannn](https://github.com/imaryannn)

## 🙏 Acknowledgments

- Google Gmail API for email operations
- Vercel for seamless deployment
- MongoDB Atlas for database hosting
- All open-source contributors

## 📞 Support

For support, email thatsaryn@gmail.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Dark mode
- [ ] Email templates
- [ ] Scheduled sending
- [ ] Email signatures
- [ ] Keyboard shortcuts
- [ ] Advanced search filters
- [ ] Email threading
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)

---

Made with ❤️ by Aryan
