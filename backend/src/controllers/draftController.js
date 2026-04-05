import { googleAuthService } from '../services/googleAuth.js';

export const saveDraft = async (req, res) => {
  try {
    const { to, cc, bcc, subject, body } = req.body;
    const user = req.user;

    const gmail = googleAuthService.getGmailClient(user.accessToken, user.refreshToken);

    const emailLines = [`To: ${to || ''}`, `Subject: ${subject || '(No Subject)'}`];
    
    if (cc) emailLines.push(`Cc: ${cc}`);
    if (bcc) emailLines.push(`Bcc: ${bcc}`);
    
    emailLines.push('Content-Type: text/html; charset=utf-8');
    emailLines.push('');
    emailLines.push(body || '');
    
    const email = emailLines.join('\n');

    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedEmail,
        },
      },
    });

    res.json({ success: true, message: 'Draft saved successfully' });
  } catch (error) {
    console.error('Failed to save draft:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
};

export const deleteDraft = async (req, res) => {
  try {
    const { draftId } = req.params;
    const user = req.user;

    const gmail = googleAuthService.getGmailClient(user.accessToken, user.refreshToken);

    await gmail.users.drafts.delete({
      userId: 'me',
      id: draftId,
    });

    res.json({ success: true, message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Failed to delete draft:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
};
