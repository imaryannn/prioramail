import { googleAuthService } from './googleAuth.js';

// Keyword-based categorization (no AI)
function keywordBasedCategorization(email) {
  const subject = email.subject?.toLowerCase() || '';
  const snippet = email.snippet?.toLowerCase() || '';
  const from = email.from?.toLowerCase() || '';
  const text = `${subject} ${snippet} ${from}`;

  // Verification codes - check first (highest priority for these)
  if (text.includes('verification') || text.includes('verify') || text.includes('otp') || 
      text.includes('code') || text.includes('passcode') ||
      text.includes('authenticate') || text.includes('2fa') || text.includes('two-factor') ||
      text.includes('security code') || text.includes('login code') || 
      text.includes('sign in code') || text.includes('signin code') ||
      text.includes('confirm your') && (text.includes('email') || text.includes('account')) ||
      text.includes('one-time') || text.includes('temporary code') ||
      /\b\d{4,8}\b/.test(text) && (text.includes('your') || text.includes('code'))) {
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

  // Promotions and marketing
  if (text.includes('discount') || text.includes('offer') || text.includes('sale') || 
      text.includes('deal') || text.includes('promo') || text.includes('coupon') || 
      text.includes('% off') || text.includes('percent off') || text.includes('save') && text.includes('$') ||
      text.includes('limited time') || text.includes('special offer')) {
    return 'promotions';
  }

  // Newsletters
  if (text.includes('newsletter') || text.includes('unsubscribe') || 
      text.includes('weekly digest') || text.includes('monthly update') || 
      text.includes('subscribe') || text.includes('mailing list')) {
    return 'newsletters';
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
  async getEmails(user, maxResults = 10, pageToken = null, useAI = false) {
    const gmail = googleAuthService.getGmailClient(user.accessToken, user.refreshToken);
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
      q: 'in:inbox',
      pageToken: pageToken
    });

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

    const emails = await Promise.all(emailPromises);
    
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
