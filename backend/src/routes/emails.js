import express from 'express';
import { emailController } from '../controllers/emailController.js';
import { sendEmail } from '../controllers/sendEmailController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, emailController.getEmails);
router.get('/:id', authMiddleware, emailController.getEmail);
router.post('/send', authMiddleware, sendEmail);

export default router;
