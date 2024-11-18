import mailgun from 'mailgun-js';

if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
  throw new Error('Mailgun configuration missing');
}

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

export const emailService = {
  async sendEmail(to: string, subject: string, html: string, from: string) {
    try {
      await mg.messages().send({
        from,
        to,
        subject,
        html
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  async sendBulkEmails(emails: Array<{
    to: string;
    subject: string;
    html: string;
    from: string;
  }>) {
    try {
      const promises = emails.map(email => 
        mg.messages().send({
          from: email.from,
          to: email.to,
          subject: email.subject,
          html: email.html
        })
      );
      
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      throw error;
    }
  }
};