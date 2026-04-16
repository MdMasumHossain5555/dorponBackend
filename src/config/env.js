const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: process.env.PORT || 4001,
  databaseUri: process.env.DATABASE_URI,
  jwtSecret: process.env.JWT_SECRET,
  frontendUri: process.env.FRONTEND_URI,
  cloudinaryUrl: process.env.CLOUDINARY_URL,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
};
