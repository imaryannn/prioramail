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

This is proprietary software. Contributions are not accepted at this time.

For inquiries, please contact thatsaryn@gmail.com

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

For inquiries, please contact thatsaryn@gmail.com

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
