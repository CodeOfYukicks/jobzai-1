import * as mailgun from 'mailgun-js';
import * as admin from "firebase-admin";

async function getMailgunConfig() {
  const configDoc = await admin.firestore()
    .collection('settings')
    .doc('mailgun')
    .get();
  
  const config = configDoc.data();
  
  if (!config?.apiKey || !config?.domain) {
    throw new Error('Mailgun configuration missing in Firestore');
  }
  
  return config;
}

export const emailService = {
  async sendEmail(to: string, subject: string, html: string, from: string) {
    try {
      const config = await getMailgunConfig();
      
      const mg = mailgun({
        apiKey: config.apiKey,
        domain: config.domain
      });

      await mg.messages().send({
        from: from || config.fromEmail,
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
    from?: string;
  }>) {
    try {
      const config = await getMailgunConfig();
      
      const mg = mailgun({
        apiKey: config.apiKey,
        domain: config.domain
      });

      const promises = emails.map(email => 
        mg.messages().send({
          from: email.from || config.fromEmail,
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