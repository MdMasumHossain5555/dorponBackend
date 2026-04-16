const cloudinary = require("../config/cloudinary");

const uploadProductImage = async (file) => {
  if (!file || !file.buffer) {
    const error = new Error("Image file is required");
    error.statusCode = 400;
    throw error;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          const uploadError = new Error("Failed to upload product image");
          uploadError.statusCode = 500;
          reject(uploadError);
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

const uploadProductImages = async (files = []) => {
  return Promise.all(files.map(uploadProductImage));
};

module.exports = { uploadProductImage, uploadProductImages };
