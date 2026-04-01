import { googleAuthService } from './googleAuth.js';
import { aiService } from './aiService.js';

export const gmailService = {
  async getEmails(user, maxResults = 50) {
    const gmail = googleAuthService.getGmailClient(user.accessToken, user.refreshToken);
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
      q: 'in:inbox',
    });

    if (!response.data.messages) {
      return [];
    }

    const emailPromises = response.data.messages.map(async (message) => {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });

      const parsed = this.parseEmail(email.data);
      parsed.priority = aiService.categorizeEmail(parsed);
      return parsed;
    });

    return await Promise.all(emailPromises);
  },

  parseEmail(emailData) {
    const headers = emailData.payload.headers;
    const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    let body = '';
    if (emailData.payload.body.data) {
      body = Buffer.from(emailData.payload.body.data, 'base64').toString('utf-8');
    } else if (emailData.payload.parts) {
      const textPart = emailData.payload.parts.find(part => part.mimeType === 'text/plain');
      if (textPart && textPart.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }

    return {
      id: emailData.id,
      threadId: emailData.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      date: new Date(parseInt(emailData.internalDate)),
      body: body.substring(0, 500),
      snippet: emailData.snippet,
      unread: emailData.labelIds?.includes('UNREAD') || false,
      labels: emailData.labelIds || [],
    };
  },
};
