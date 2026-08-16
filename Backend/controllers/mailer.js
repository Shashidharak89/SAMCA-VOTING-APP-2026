const nodemailer = require('nodemailer');

// Validate required env vars early so the app fails fast with a clear message
const { EMAIL_USER, EMAIL_PASS, SMTP_HOST, SMTP_PORT, SMTP_SECURE } = process.env;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('[mailer] Missing EMAIL_USER or EMAIL_PASS environment variables.');
  console.error('[mailer] Create a Backend/.env file (copy from .env.example) and set EMAIL_USER / EMAIL_PASS.');
  // Export a dummy transporter that always rejects to avoid unhandled exceptions downstream
  module.exports = { 
    sendMail: async () => { 
      throw new Error('Email transport not configured: missing EMAIL_USER or EMAIL_PASS'); 
    } 
  };
  return;
}


// Enable SMTP connection pooling
const poolConfig = {
  pool: true,
  maxConnections: process.env.SMTP_POOL_MAX ? Number(process.env.SMTP_POOL_MAX) : 5,
  maxMessages: process.env.SMTP_POOL_MAX_MSG ? Number(process.env.SMTP_POOL_MAX_MSG) : 100,
  rateLimit: process.env.SMTP_POOL_RATE_LIMIT ? Number(process.env.SMTP_POOL_RATE_LIMIT) : false
};

let transportOptions;
if (SMTP_HOST) {
  transportOptions = {
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    secure: SMTP_SECURE === 'true' || SMTP_SECURE === '1',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    ...poolConfig
  };
} else {
  transportOptions = {
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    ...poolConfig
  };
}

const transporter = nodemailer.createTransport(transportOptions);

// Optional one-time verification so startup reveals credential issues immediately
transporter.verify().then(() => {
  console.log('[mailer] Email transporter ready');
}).catch(err => {
  console.error('[mailer] Transport verification failed:', err.message);
});

module.exports = transporter;
