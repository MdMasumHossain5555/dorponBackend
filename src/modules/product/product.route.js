const express = require("express");
const {
  getProducts,
  addProducts,
  getProductById,
  updateProduct,
} = require("./product.controller");
const { uploadProductImages } = require("../../middlewares/upload.middleware");
const { protect, admin } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", getProducts);
router.post("/", protect, admin, uploadProductImages, addProducts);
router.get("/pages/product/:id", getProductById);
router.put("/:id", protect, admin, uploadProductImages, updateProduct);

module.exports = router;
