const { v2: cloudinary } = require("cloudinary");
const env = require("./env");

const getCloudName = () => {
  if (!env.cloudinaryUrl) {
    return "";
  }

  try {
    const cloudinaryUrl = new URL(env.cloudinaryUrl);
    return cloudinaryUrl.hostname;
  } catch (error) {
    return "";
  }
};

const cloudName = getCloudName();

if (!cloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
  throw new Error("Cloudinary configuration is missing");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
  secure: true,
});

module.exports = cloudinary;
