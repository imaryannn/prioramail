import { googleAuthService } from '../services/googleAuth.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export const sendEmailMiddleware = upload.array('attachments', 10);

export const sendEmail = async (req, res) => {
  try {
    const { to, cc, bcc, subject, body } = req.body;
    const attachments = req.files || [];
    const user = req.user;

    const gmail = googleAuthService.getGmailClient(user.accessToken, user.refreshToken);

    // Create MIME message with attachments
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36)}`;
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
    ];
    
    if (cc) emailLines.push(`Cc: ${cc}`);
    if (bcc) emailLines.push(`Bcc: ${bcc}`);
    
    emailLines.push('MIME-Version: 1.0');
    emailLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    emailLines.push('');
    emailLines.push(`--${boundary}`);
    emailLines.push('Content-Type: text/html; charset=utf-8');
    emailLines.push('');
    emailLines.push(body);
    emailLines.push('');
    
    // Add attachments
    for (const file of attachments) {
      emailLines.push(`--${boundary}`);
      emailLines.push(`Content-Type: ${file.mimetype}`);
      emailLines.push('Content-Transfer-Encoding: base64');
      emailLines.push(`Content-Disposition: attachment; filename="${file.originalname}"`);
      emailLines.push('');
      emailLines.push(file.buffer.toString('base64'));
      emailLines.push('');
    }
    
    emailLines.push(`--${boundary}--`);
    
    const email = emailLines.join('\n');

    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Failed to send email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};
