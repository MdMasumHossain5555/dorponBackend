const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "Each image must be smaller than 5MB" });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res
        .status(400)
        .json({ message: "You can upload up to 5 product images" });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Invalid file field name" });
    }
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ message: err.message || "Server error" });
};

module.exports = { errorHandler };
