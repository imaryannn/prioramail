import { googleAuthService } from './googleAuth.js';
import he from 'he';

// Keyword-based categorization (no AI)
function keywordBasedCategorization(email) {
  const subject = email.subject?.toLowerCase() || '';
  const snippet = email.snippet?.toLowerCase() || '';
  const from = email.from?.toLowerCase() || '';
  const text = `${subject} ${snippet} ${from}`;

  // Promotions and marketing - check FIRST to avoid false verification matches
  if (text.includes('discount') || text.includes('offer') || text.includes('sale') || 
      text.includes('deal') || text.includes('promo') || text.includes('coupon') || 
      text.includes('% off') || text.includes('percent off') || 
      text.includes('limited time') || text.includes('special offer') ||
      text.includes('use code') || text.includes('promo code') || text.includes('discount code') ||
      text.includes('save big') || text.includes('don\'t miss') || text.includes('ending soon')) {
    return 'promotions';
  }

  // Newsletters - check early
  if (text.includes('newsletter') || text.includes('unsubscribe') || 
      text.includes('weekly digest') || text.includes('monthly update') || 
      text.includes('subscribe') || text.includes('mailing list') ||
      text.includes('view this issue') || text.includes('view it in your browser')) {
    return 'newsletters';
  }

  // Verification codes - more specific patterns
  if (text.includes('verification code') || text.includes('verify your') || 
      text.includes('otp') || text.includes('one-time password') ||
      text.includes('authentication code') || text.includes('2fa') || text.includes('two-factor') ||
      text.includes('security code') || text.includes('login code') || 
      text.includes('sign in code') || text.includes('signin code') ||
      text.includes('confirm your email') || text.includes('confirm your account') ||
      text.includes('temporary code') || text.includes('access code') ||
      subject.includes('your code') && !text.includes('use code') ||
      /\b\d{4,8}\b/.test(subject) && (subject.includes('code') || subject.includes('verify'))) {
    return 'verification';
  }

  // Receipts and orders
  if (text.includes('receipt') || text.includes('invoice') || 
      text.includes('order') && (text.includes('confirm') || text.includes('ship')) ||
      text.includes('payment received') || text.includes('transaction') || 
      text.includes('purchase') || text.includes('paid')) {
    return 'receipts';
  }

  // Social media - check domains and keywords
  if (from.includes('linkedin') || from.includes('facebook') || from.includes('twitter') || 
      from.includes('instagram') || from.includes('facebookmail') || from.includes('x.com') ||
      text.includes('connection request') || text.includes('friend request') || 
      text.includes('mentioned you') || text.includes('tagged you')) {
    return 'social';
  }

  // Updates and notifications
  if (text.includes('notification') || text.includes('new comment') || 
      text.includes('new message') || text.includes('activity') || 
      text.includes('reminder') || text.includes('alert')) {
    return 'updates';
  }

  // Spam indicators
  if (text.includes('congratulations you won') || text.includes('claim your prize') || 
      text.includes('click here now') || text.includes('act now') || 
      text.includes('free money') || text.includes('you have won')) {
    return 'spam';
  }

  // Focus keywords (urgent/important) - check last to avoid false positives
  if (text.includes('meeting') || text.includes('urgent') || text.includes('important') || 
      text.includes('deadline') || text.includes('approval') || text.includes('review') || 
      text.includes('action required') || text.includes('asap') || text.includes('critical')) {
    return 'focus';
  }

  // Default to later
  return 'later';
}

export const gmailService = {
  async getEmails(user, maxResults = 10, pageToken = null, useAI = false, label = null) {
    const gmail = googleAuthService.getGmailClient(user.accessToken, user.refreshToken);
    
    // Build query based on label
    let query = '';
    let labelIds = [];
    
    if (label) {
      // Use labelIds for better filtering
      switch(label) {
        case 'SENT':
          // Use SENT labelId - this is the proper way to get sent emails
          labelIds = ['SENT'];
          break;
        case 'DRAFT':
          labelIds = ['DRAFT'];
          break;
        case 'STARRED':
          labelIds = ['STARRED'];
          break;
        default:
          query = 'in:inbox';
      }
    } else {
      query = 'in:inbox';
    }
    
    const listParams = {
      userId: 'me',
      maxResults: maxResults,
      pageToken: pageToken
    };
    
    if (labelIds.length > 0 && !query) {
      listParams.labelIds = labelIds;
    } else {
      listParams.q = query;
    }
    
    const response = await gmail.users.messages.list(listParams);

    if (!response.data.messages || response.data.messages.length === 0) {
      return { emails: [], nextPageToken: null };
    }

    // Fetch full email details
    const emailPromises = response.data.messages.map(async (message) => {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });

      const parsed = this.parseEmail(email.data);
      
      // Use keyword-based categorization only (AI removed)
      parsed.priority = keywordBasedCategorization(parsed);
      
      return parsed;
    });

    let emails = await Promise.all(emailPromises);
    
    // For SENT view, filter out emails that don't have user's email in From header
    if (label === 'SENT') {
      const userEmail = user.email.toLowerCase();
      emails = emails.filter(email => {
        const fromEmail = email.from.toLowerCase();
        return fromEmail.includes(userEmail);
      });
    }
    
    return {
      emails,
      nextPageToken: response.data.nextPageToken || null
    };
  },

  parseEmail(emailData) {
    const headers = emailData.payload.headers;
    const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    let body = '';
    let htmlBody = '';
    let attachments = [];
    
    const extractBody = (part) => {
      // Check for attachments
      if (part.filename && part.filename.length > 0) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size,
          attachmentId: part.body.attachmentId
        });
      }
      
      if (part.mimeType === 'text/plain' && part.body.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.mimeType === 'text/html' && part.body.data) {
        const rawHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
        // Decode HTML entities (sometimes Gmail encodes them)
        htmlBody = he.decode(rawHtml);
      }
      if (part.parts) {
        part.parts.forEach(extractBody);
      }
    };

    if (emailData.payload.body.data) {
      const rawBody = Buffer.from(emailData.payload.body.data, 'base64').toString('utf-8');
      // Check if it's HTML or plain text
      if (emailData.payload.mimeType === 'text/html') {
        htmlBody = he.decode(rawBody);
      } else {
        body = rawBody;
      }
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
      attachments: attachments,
    };
  },
};
