import express from 'express';
import { emailController } from '../controllers/emailController.js';
import { sendEmail, sendEmailMiddleware } from '../controllers/sendEmailController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, emailController.getEmails);
router.get('/:id', authMiddleware, emailController.getEmail);
router.get('/:messageId/attachments/:attachmentId', authMiddleware, emailController.getAttachment);
router.post('/send', authMiddleware, sendEmailMiddleware, sendEmail);

export default router;
