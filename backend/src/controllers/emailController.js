import { gmailService } from '../services/gmailService.js';
import { googleAuthService } from '../services/googleAuth.js';

export const emailController = {
  async getEmails(req, res) {
    try {
      const user = req.user;
      const emails = await gmailService.getEmails(user);
      res.json({ emails });
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
};
