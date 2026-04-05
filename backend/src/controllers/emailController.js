import { gmailService } from '../services/gmailService.js';
import { googleAuthService } from '../services/googleAuth.js';

export const emailController = {
  async getEmails(req, res) {
    try {
      const user = req.user;
      const maxResults = req.query.maxResults ? parseInt(req.query.maxResults) : 10;
      const pageToken = req.query.pageToken || null;
      const useAI = req.query.useAI === 'true';
      const label = req.query.label || null;
      const result = await gmailService.getEmails(user, maxResults, pageToken, useAI, label);
      res.json(result);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      res.status(500).json({ error: 'Failed to fetch emails' });
    }
  },

  async getEmail(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;
      
      const gmail = googleAuthService.getGmailClient(user.accessToken, user.refreshToken);
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: id,
        format: 'full',
      });

      res.json({ email: gmailService.parseEmail(email.data) });
    } catch (error) {
      console.error('Failed to fetch email:', error);
      res.status(500).json({ error: 'Failed to fetch email' });
    }
  },

  async getAttachment(req, res) {
    try {
      const { messageId, attachmentId } = req.params;
      const user = req.user;
      
      const gmail = googleAuthService.getGmailClient(user.accessToken, user.refreshToken);
      const response = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId,
      });

      // The data is in response.data.data as URL-safe base64
      const attachmentData = response.data.data;
      
      // Convert URL-safe base64 to standard base64
      const base64Data = attachmentData.replace(/-/g, '+').replace(/_/g, '/');
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment');
      res.send(buffer);
    } catch (error) {
      console.error('Failed to fetch attachment:', error);
      res.status(500).json({ error: 'Failed to fetch attachment' });
    }
  },
};
