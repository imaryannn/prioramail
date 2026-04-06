import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { config } from './config/config.js';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import emailRoutes from './routes/emails.js';

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://127.0.0.1:3001', 
    'http://localhost:3001',
    'http://localhost:5500',
    'https://prioramail.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean), 
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Routes
app.use('/auth', authRoutes);
app.use('/emails', emailRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
