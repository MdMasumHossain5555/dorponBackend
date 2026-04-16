const express = require("express");
const { addOrder, getOrders, getOrderById } = require("./order.controller");
const { protect, admin } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, addOrder);
router.get("/", protect, admin, getOrders);

module.exports = router;
