const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const {
  getCartByUserId,
  addToCart,
  removeFromCart,
  updateCart,
} = require("./cart.controller");

const router = express.Router();

router.get("/", protect, getCartByUserId);
router.post("/", protect, addToCart);
router.delete("/", protect, removeFromCart);
router.delete("/:productId", protect, removeFromCart);
router.put("/", protect, updateCart);

module.exports = router;
