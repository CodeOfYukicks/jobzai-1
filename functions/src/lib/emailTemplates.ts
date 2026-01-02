// Premium branded email templates for Cubbbe
// Uses Brevo transactional email API

export interface EmailTemplateData {
  recipientEmail: string;
  recipientName?: string;
  verificationLink?: string;
  resetLink?: string;
  appName?: string;
}

const BRAND_COLORS = {
  primary: '#7C3AED', // Violet
  primaryDark: '#5B21B6',
  dark: '#0f0f0f',
  darkGradient1: '#1a1a2e',
  darkGradient2: '#2d1f4e',
  darkGradient3: '#3b2a6b',
  white: '#ffffff',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
};

const getBaseStyles = () => `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: ${BRAND_COLORS.lightGray};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: ${BRAND_COLORS.white};
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
  .header {
    background: linear-gradient(135deg, ${BRAND_COLORS.dark} 0%, ${BRAND_COLORS.darkGradient1} 30%, ${BRAND_COLORS.darkGradient2} 60%, ${BRAND_COLORS.darkGradient3} 100%);
    padding: 48px 40px;
    text-align: center;
  }
  .logo {
    width: 48px;
    height: 48px;
    margin-bottom: 24px;
  }
  .header-title {
    color: ${BRAND_COLORS.white};
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }
  .header-subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    margin: 0;
    font-weight: 400;
  }
  .content {
    padding: 40px;
  }
  .greeting {
    font-size: 18px;
    font-weight: 600;
    color: ${BRAND_COLORS.dark};
    margin: 0 0 16px 0;
  }
  .message {
    font-size: 15px;
    color: ${BRAND_COLORS.gray};
    line-height: 1.6;
    margin: 0 0 32px 0;
  }
  .button-container {
    text-align: center;
    margin: 32px 0;
  }
  .button {
    display: inline-block;
    background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryDark} 100%);
    color: ${BRAND_COLORS.white} !important;
    text-decoration: none;
    padding: 16px 48px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
    box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
    transition: all 0.2s ease;
  }
  .button:hover {
    box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
    transform: translateY(-1px);
  }
  .divider {
    height: 1px;
    background-color: ${BRAND_COLORS.lightGray};
    margin: 32px 0;
  }
  .features {
    display: flex;
    justify-content: space-around;
    text-align: center;
    padding: 24px 0;
  }
  .feature {
    flex: 1;
  }
  .feature-value {
    font-size: 24px;
    font-weight: 700;
    color: ${BRAND_COLORS.primary};
    margin: 0;
  }
  .feature-label {
    font-size: 12px;
    color: ${BRAND_COLORS.gray};
    margin: 4px 0 0 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .footer {
    background-color: ${BRAND_COLORS.lightGray};
    padding: 32px 40px;
    text-align: center;
  }
  .footer-text {
    font-size: 12px;
    color: ${BRAND_COLORS.gray};
    margin: 0 0 16px 0;
    line-height: 1.5;
  }
  .footer-links {
    margin: 0;
  }
  .footer-link {
    color: ${BRAND_COLORS.gray};
    text-decoration: underline;
    font-size: 12px;
    margin: 0 8px;
  }
  .help-text {
    font-size: 13px;
    color: ${BRAND_COLORS.gray};
    margin: 24px 0 0 0;
    padding: 16px;
    background-color: ${BRAND_COLORS.lightGray};
    border-radius: 8px;
    line-height: 1.5;
  }
  .link-fallback {
    font-size: 12px;
    color: ${BRAND_COLORS.gray};
    word-break: break-all;
    margin-top: 16px;
  }
`;

/**
 * Email Verification Template
 */
export const getEmailVerificationTemplate = (data: EmailTemplateData): string => {
  const name = data.recipientName || 'there';
  const appName = data.appName || 'Cubbbe';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Verify your email - ${appName}</title>
  <style>
    :root { color-scheme: light only; }
    ${getBaseStyles()}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="padding: 40px 20px; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <!-- Header with Gmail dark mode fix -->
      <div style="background-color: #2d1f4e !important; background-image: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 30%, #2d1f4e 60%, #3b2a6b 100%); padding: 48px 40px; text-align: center;">
        <img src="https://cubbbe.com/images/logo-only.png" alt="${appName}" style="width: 48px; height: 48px; margin-bottom: 24px;">
        <h1 style="color: #ffffff !important; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-text-fill-color: #ffffff !important;">Welcome to ${appName}! 🎉</h1>
        <p style="color: #cccccc !important; font-size: 16px; margin: 0; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-text-fill-color: #cccccc !important;">Your AI-powered job search starts now</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px; background-color: #ffffff;">
        <p style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Hey ${name},</p>
        <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          Thanks for joining ${appName}! We're excited to help you land your dream job with AI-powered applications.
          <br><br>
          Click the button below to verify your email and unlock all features:
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: #ffffff !important; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; letter-spacing: -0.2px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Verify my email →</a>
        </div>
        
        <div style="height: 1px; background-color: #e5e7eb; margin: 32px 0;"></div>
        
        <!-- Stats -->
        <table width="100%" cellpadding="0" cellspacing="0" style="text-align: center; background-color: #ffffff;">
          <tr>
            <td style="padding: 16px;">
              <p style="font-size: 24px; font-weight: 700; color: #7C3AED; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">20K+</p>
              <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Active Users</p>
            </td>
            <td style="padding: 16px;">
              <p style="font-size: 24px; font-weight: 700; color: #7C3AED; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">93%</p>
              <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Success Rate</p>
            </td>
            <td style="padding: 16px;">
              <p style="font-size: 24px; font-weight: 700; color: #7C3AED; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">50K+</p>
              <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Jobs Applied</p>
            </td>
          </tr>
        </table>
        
        <p style="font-size: 13px; color: #4b5563; margin: 24px 0 0 0; padding: 16px; background-color: #f9fafb; border-radius: 8px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          ⚡ <strong style="color: #1f2937;">Pro tip:</strong> After verifying, complete your profile to get personalized job matches and AI-powered cover letters tailored just for you.
        </p>
        
        <p style="font-size: 12px; color: #6b7280; word-break: break-all; margin-top: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${data.verificationLink}" style="color: #7C3AED;">${data.verificationLink}</a>
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 32px 40px; text-align: center;">
        <p style="font-size: 12px; color: #6b7280; margin: 0 0 16px 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          You're receiving this email because you signed up for ${appName}.<br>
          If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          <a href="https://cubbbe.com/privacy" style="color: #6b7280; text-decoration: underline; font-size: 12px; margin: 0 8px;">Privacy Policy</a>
          <a href="https://cubbbe.com/terms" style="color: #6b7280; text-decoration: underline; font-size: 12px; margin: 0 8px;">Terms of Service</a>
          <a href="https://cubbbe.com/help" style="color: #6b7280; text-decoration: underline; font-size: 12px; margin: 0 8px;">Help Center</a>
        </p>
        <p style="font-size: 11px; color: #9ca3af; margin-top: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          © 2026 Cubbbe. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

/**
 * Password Reset Template
 */
export const getPasswordResetTemplate = (data: EmailTemplateData): string => {
  const name = data.recipientName || 'there';
  const appName = data.appName || 'Cubbbe';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Reset your password - ${appName}</title>
  <style>
    :root { color-scheme: light only; }
    ${getBaseStyles()}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="padding: 40px 20px; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <!-- Header with Gmail dark mode fix -->
      <div style="background-color: #2d1f4e !important; background-image: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 30%, #2d1f4e 60%, #3b2a6b 100%); padding: 48px 40px; text-align: center;">
        <img src="https://cubbbe.com/images/logo-only.png" alt="${appName}" style="width: 48px; height: 48px; margin-bottom: 24px;">
        <h1 style="color: #ffffff !important; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-text-fill-color: #ffffff !important;">Password Reset 🔐</h1>
        <p style="color: #cccccc !important; font-size: 16px; margin: 0; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-text-fill-color: #cccccc !important;">Let's get you back into your account</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px; background-color: #ffffff;">
        <p style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Hey ${name},</p>
        <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          We received a request to reset your password. No worries, it happens to the best of us!
          <br><br>
          Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.resetLink}" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: #ffffff !important; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; letter-spacing: -0.2px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Reset my password →</a>
        </div>
        
        <p style="font-size: 13px; color: #4b5563; margin: 24px 0 0 0; padding: 16px; background-color: #f9fafb; border-radius: 8px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          🔒 <strong style="color: #1f2937;">Security note:</strong> This link expires in 1 hour for your protection. If you didn't request this reset, you can safely ignore this email – your password won't change.
        </p>
        
        <p style="font-size: 12px; color: #6b7280; word-break: break-all; margin-top: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${data.resetLink}" style="color: #7C3AED;">${data.resetLink}</a>
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 32px 40px; text-align: center;">
        <p style="font-size: 12px; color: #6b7280; margin: 0 0 16px 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          You're receiving this email because a password reset was requested for your ${appName} account.<br>
          If you didn't request this, please ignore this email.
        </p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          <a href="https://cubbbe.com/privacy" style="color: #6b7280; text-decoration: underline; font-size: 12px; margin: 0 8px;">Privacy Policy</a>
          <a href="https://cubbbe.com/terms" style="color: #6b7280; text-decoration: underline; font-size: 12px; margin: 0 8px;">Terms of Service</a>
          <a href="https://cubbbe.com/help" style="color: #6b7280; text-decoration: underline; font-size: 12px; margin: 0 8px;">Help Center</a>
        </p>
        <p style="font-size: 11px; color: #9ca3af; margin-top: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          © 2026 Cubbbe. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

/**
 * Welcome Email Template (sent after verification)
 */
export const getWelcomeEmailTemplate = (data: EmailTemplateData): string => {
  const name = data.recipientName || 'there';
  const appName = data.appName || 'Cubbbe';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Welcome to ${appName}!</title>
  <style>
    :root { color-scheme: light only; }
    ${getBaseStyles()}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="padding: 40px 20px; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <!-- Header with Gmail dark mode fix -->
      <div style="background-color: #2d1f4e !important; background-image: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 30%, #2d1f4e 60%, #3b2a6b 100%); padding: 48px 40px; text-align: center;">
        <img src="https://cubbbe.com/images/logo-only.png" alt="${appName}" style="width: 48px; height: 48px; margin-bottom: 24px;">
        <h1 style="color: #ffffff !important; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-text-fill-color: #ffffff !important;">You're all set! 🚀</h1>
        <p style="color: #cccccc !important; font-size: 16px; margin: 0; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-text-fill-color: #cccccc !important;">Your journey to your dream job begins</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px; background-color: #ffffff;">
        <p style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Hey ${name},</p>
        <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          Your email is verified and your account is ready to go! Here's what you can do now:
        </p>
        
        <div style="padding: 24px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
            <tr>
              <td style="padding: 12px 0;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 40px; vertical-align: top;">
                      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #7C3AED, #5B21B6); border-radius: 8px; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">1</div>
                    </td>
                    <td style="padding-left: 16px;">
                      <p style="margin: 0; font-weight: 600; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Complete your profile</p>
                      <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Add your experience and skills for better matches</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 40px; vertical-align: top;">
                      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #7C3AED, #5B21B6); border-radius: 8px; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">2</div>
                    </td>
                    <td style="padding-left: 16px;">
                      <p style="margin: 0; font-weight: 600; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Upload your resume</p>
                      <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Our AI will optimize it for each application</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 40px; vertical-align: top;">
                      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #7C3AED, #5B21B6); border-radius: 8px; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">3</div>
                    </td>
                    <td style="padding-left: 16px;">
                      <p style="margin: 0; font-weight: 600; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Start applying</p>
                      <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Browse jobs and let AI craft perfect applications</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://cubbbe.com/hub" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: #ffffff !important; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; letter-spacing: -0.2px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Go to my dashboard →</a>
        </div>
        
        <p style="font-size: 13px; color: #4b5563; margin: 24px 0 0 0; padding: 16px; background-color: #f9fafb; border-radius: 8px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          💡 <strong style="color: #1f2937;">Need help?</strong> Our AI assistant is available 24/7 to answer your questions. Just click the chat icon in the app!
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 32px 40px; text-align: center;">
        <p style="font-size: 12px; color: #6b7280; margin: 0 0 16px 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          Welcome to the ${appName} community! We're here to help you succeed.
        </p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          <a href="https://cubbbe.com/privacy" style="color: #6b7280; text-decoration: underline; font-size: 12px; margin: 0 8px;">Privacy Policy</a>
          <a href="https://cubbbe.com/terms" style="color: #6b7280; text-decoration: underline; font-size: 12px; margin: 0 8px;">Terms of Service</a>
          <a href="https://cubbbe.com/help" style="color: #6b7280; text-decoration: underline; font-size: 12px; margin: 0 8px;">Help Center</a>
        </p>
        <p style="font-size: 11px; color: #9ca3af; margin-top: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          © 2026 Cubbbe. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
};
