import { googleAuthService } from './googleAuth.js';

// Keyword-based categorization (no AI)
function keywordBasedCategorization(email) {
  const subject = email.subject?.toLowerCase() || '';
  const body = email.body?.toLowerCase() || '';
  const from = email.from?.toLowerCase() || '';
  const text = `${subject} ${body} ${from}`;

  // Focus keywords (urgent/important)
  const focusKeywords = ['meeting', 'urgent', 'important', 'deadline', 'approval', 'review', 'action required', 'asap', 'critical'];
  if (focusKeywords.some(keyword => text.includes(keyword))) {
    return 'focus';
  }

  // Verification codes
  const verificationKeywords = ['verification code', 'verify', 'otp', 'one-time password', 'confirm your', 'authentication code', 'security code', '2fa', 'two-factor'];
  if (verificationKeywords.some(keyword => text.includes(keyword))) {
    return 'verification';
  }

  // Receipts and orders
  const receiptKeywords = ['receipt', 'invoice', 'order confirmation', 'payment received', 'transaction', 'your order', 'purchase confirmation'];
  if (receiptKeywords.some(keyword => text.includes(keyword))) {
    return 'receipts';
  }

  // Newsletters
  const newsletterKeywords = ['newsletter', 'unsubscribe', 'weekly digest', 'monthly update', 'subscribe'];
  if (newsletterKeywords.some(keyword => text.includes(keyword))) {
    return 'newsletters';
  }

  // Promotions and marketing
  const promotionKeywords = ['discount', 'offer', 'sale', 'deal', 'promo', 'coupon', '% off', 'limited time', 'special offer'];
  if (promotionKeywords.some(keyword => text.includes(keyword))) {
    return 'promotions';
  }

  // Social media
  const socialKeywords = ['linkedin', 'facebook', 'twitter', 'instagram', 'connection request', 'friend request', 'mentioned you', 'tagged you'];
  const socialDomains = ['linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com'];
  if (socialKeywords.some(keyword => text.includes(keyword)) || socialDomains.some(domain => from.includes(domain))) {
    return 'social';
  }

  // Updates and notifications
  const updateKeywords = ['notification', 'update', 'new comment', 'new message', 'activity', 'reminder'];
  if (updateKeywords.some(keyword => text.includes(keyword))) {
    return 'updates';
  }

  // Spam indicators
  const spamKeywords = ['congratulations you won', 'claim your prize', 'click here now', 'act now', 'limited time offer', 'free money'];
  if (spamKeywords.some(keyword => text.includes(keyword))) {
    return 'spam';
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
