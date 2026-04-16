const multer = require("multer");

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }

  const error = new Error("Only image files are allowed");
  error.statusCode = 400;
  cb(error);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: MAX_IMAGE_COUNT,
  },
  fileFilter,
});

const uploadProductImages = upload.array("images", MAX_IMAGE_COUNT);

module.exports = { uploadProductImages, MAX_IMAGE_COUNT };
