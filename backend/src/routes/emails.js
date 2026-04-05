import express from 'express';
import { emailController } from '../controllers/emailController.js';
import { sendEmail, sendEmailMiddleware } from '../controllers/sendEmailController.js';
import { saveDraft, deleteDraft } from '../controllers/draftController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, emailController.getEmails);
router.get('/:id', authMiddleware, emailController.getEmail);
router.get('/:messageId/attachments/:attachmentId', authMiddleware, emailController.getAttachment);
router.post('/send', authMiddleware, sendEmailMiddleware, sendEmail);
router.post('/draft', authMiddleware, saveDraft);
router.delete('/draft/:draftId', authMiddleware, deleteDraft);

export default router;
