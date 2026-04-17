const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: process.env.PORT || 4001,
  databaseUri: process.env.DATABASE_URI,
  jwtSecret: process.env.JWT_SECRET,
  backendUri: process.env.BACKEND_URI,
  frontendUri: process.env.FRONTEND_URI,
  cloudinaryUrl: process.env.CLOUDINARY_URL,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  sslStoreId: process.env.SSL_STORE_ID,
  sslStorePassword: process.env.SSL_STORE_PASSWORD,
  sslIsLive: process.env.SSL_IS_LIVE === "true",
};
