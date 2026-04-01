export const aiService = {
  categorizeEmail(email) {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    const from = (email.from || '').toLowerCase();
    const content = `${subject} ${body} ${from}`;

    // Focus - Urgent/Important keywords
    const focusKeywords = [
      'urgent', 'asap', 'important', 'critical', 'deadline', 'today',
      'immediately', 'action required', 'response needed', 'meeting',
      'call', 'review', 'approval', 'confirm', 'verify', 'invoice',
      'payment', 'contract', 'legal', 'security', 'alert', 'warning'
    ];

    // Ignore - Marketing/Promotional keywords
    const ignoreKeywords = [
      'unsubscribe', 'newsletter', 'promotion', 'discount', 'sale',
      'offer', 'deal', 'coupon', 'marketing', 'advertisement',
      'no-reply', 'noreply', 'automated', 'notification',
      'update available', 'new features', 'tips', 'digest'
    ];

    // Check for ignore first
    if (ignoreKeywords.some(keyword => content.includes(keyword))) {
      return 'ignore';
    }

    // Check for focus
    if (focusKeywords.some(keyword => content.includes(keyword))) {
      return 'focus';
    }

    // Check if unread - likely important
    if (email.unread) {
      return 'focus';
    }

    // Default to later
    return 'later';
  }
};
