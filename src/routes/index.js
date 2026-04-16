const express = require("express");
const productRoutes = require("../modules/product/product.route");
const carouselRoutes = require("../modules/carousel/carousel.route");
const authRoutes = require("../modules/auth/auth.route");
const cartRoutes = require("../modules/cart/cart.route");
const orderRoutes = require("../modules/order/order.route");

const router = express.Router();

router.use("/products", productRoutes);
router.use("/carousel", carouselRoutes);
router.use("/auth", authRoutes);
router.use("/cart", cartRoutes);
router.use("/order", orderRoutes);

module.exports = router;
