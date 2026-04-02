import { config } from '../config/config.js';

export const aiService = {
  geminiKeys: config.gemini.apiKeys,
  currentKeyIndex: 0,

  async categorizeEmail(email) {
    try {
      const subject = email.subject || '';
      const body = email.body || email.snippet || '';
      const from = email.from || '';

      const prompt = `Analyze this email and categorize it into the most appropriate category.

Available categories:
- "focus": Urgent emails requiring immediate attention (meetings, deadlines, approvals, time-sensitive requests)
- "important": Important emails that need attention soon (project updates, client communications, team discussions)
- "verification": Verification codes, OTPs, account confirmations, password resets
- "receipts": Purchase confirmations, invoices, payment receipts, order updates
- "newsletters": Newsletters, digests, blog updates from subscribed sources
- "promotions": Marketing emails, sales, offers, discounts, advertisements
- "social": Social media notifications, friend requests, comments, likes
- "updates": Product updates, service announcements, system notifications
- "reminders": Calendar reminders, task notifications, follow-ups
- "spam": Unwanted emails, suspicious content, obvious spam

Email:
From: ${from}
Subject: ${subject}
Body: ${body.substring(0, 500)}

Respond with ONLY the category name (one word): focus, important, verification, receipts, newsletters, promotions, social, updates, reminders, or spam`;

      const response = await this.callGemini(prompt);
      const category = response.toLowerCase().trim();

      const validCategories = ['focus', 'important', 'verification', 'receipts', 'newsletters', 'promotions', 'social', 'updates', 'reminders', 'spam'];
      
      if (validCategories.includes(category)) {
        return category;
      }

      // Fallback to keyword-based if Gemini response is invalid
      return this.keywordBasedCategorization(email);
    } catch (error) {
      console.error('Gemini API error:', error.message);
      // Fallback to keyword-based categorization
      return this.keywordBasedCategorization(email);
    }
  },

  async callGemini(prompt) {
    const apiKey = this.geminiKeys[this.currentKeyIndex];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (response.status === 429 || response.status === 403) {
        // Rate limit or quota exceeded, switch to next key
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.geminiKeys.length;
        console.log(`Switching to API key ${this.currentKeyIndex + 1}`);
        
        // Retry with next key
        return this.callGemini(prompt);
      }

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      // If both keys fail, throw error to use fallback
      throw error;
    }
  },

  keywordBasedCategorization(email) {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    const from = (email.from || '').toLowerCase();
    const content = `${subject} ${body} ${from}`;

    // Focus - urgent/important
    if (content.match(/\b(urgent|asap|important|critical|deadline|today|immediately|action required|response needed)\b/i)) {
      return 'focus';
    }

    // Other - promotions, spam, automated
    if (content.match(/\b(unsubscribe|sale|discount|offer|deal|coupon|% off|limited time|shop now|no-reply|noreply)\b/i)) {
      return 'other';
    }

    // Default to later
    return 'later';
  }
};
