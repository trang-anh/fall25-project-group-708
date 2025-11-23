import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM = 'fakestackoverflowgroup@gmail.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const sendTwoFactorCodeEmail = async (recipient: string, code: string): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    return false;
  }

  const msg = {
    to: recipient,
    from: SENDGRID_FROM,
    subject: 'Your Fake Stack Overflow verification code',
    text: `Your verification code is ${code}. It expires in a few minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p><p>If you did not request this, you can safely ignore this email.</p>`,
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    return false;
  }
};

export default sendTwoFactorCodeEmail;
