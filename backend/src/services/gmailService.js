import { googleAuthService } from './googleAuth.js';
import { aiService } from './aiService.js';

export const gmailService = {
  async getEmails(user, maxResults = 500) {
    const gmail = googleAuthService.getGmailClient(user.accessToken, user.refreshToken);
    
    let allMessages = [];
    let pageToken = null;
    
    // Fetch all emails using pagination
    do {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 500,
        q: 'in:inbox',
        pageToken: pageToken
      });

      if (response.data.messages) {
        allMessages = allMessages.concat(response.data.messages);
      }
      
      pageToken = response.data.nextPageToken;
      
      // Limit total emails to maxResults
      if (allMessages.length >= maxResults) {
        allMessages = allMessages.slice(0, maxResults);
        break;
      }
    } while (pageToken);

    if (allMessages.length === 0) {
      return [];
    }

    // Fetch full email details in batches
    const emailPromises = allMessages.map(async (message) => {
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
    let htmlBody = '';
    
    const extractBody = (part) => {
      if (part.mimeType === 'text/plain' && part.body.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.mimeType === 'text/html' && part.body.data) {
        htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.parts) {
        part.parts.forEach(extractBody);
      }
    };

    if (emailData.payload.body.data) {
      body = Buffer.from(emailData.payload.body.data, 'base64').toString('utf-8');
    } else if (emailData.payload.parts) {
      emailData.payload.parts.forEach(extractBody);
    }

    return {
      id: emailData.id,
      threadId: emailData.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      date: new Date(parseInt(emailData.internalDate)),
      body: body,
      htmlBody: htmlBody,
      snippet: emailData.snippet,
      unread: emailData.labelIds?.includes('UNREAD') || false,
      labels: emailData.labelIds || [],
    };
  },
};
