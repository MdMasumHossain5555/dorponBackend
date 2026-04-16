const { uploadProductImages } = require("../../services/cloudinary-upload.service");

const parseArrayField = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim() !== "");
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(trimmedValue);
    if (Array.isArray(parsedValue)) {
      return parsedValue.filter(
        (item) => typeof item === "string" && item.trim() !== ""
      );
    }
  } catch (error) {}

  return trimmedValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildProductImages = async (files, bodyImages) => {
  let images = bodyImages;

  if (Array.isArray(files) && files.length > 0) {
    const uploadedImages = await uploadProductImages(files);
    images = uploadedImages.map((image) => image.secure_url);
  }

  return images;
};

module.exports = { parseArrayField, buildProductImages };
