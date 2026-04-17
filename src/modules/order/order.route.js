const express = require("express");
const {
	addOrder,
	initiateSslPayment,
	sslPaymentSuccess,
	sslPaymentFail,
	sslPaymentCancel,
	sslPaymentIpn,
	getOrders,
	getOrdersForUser,
	getOrderById,
	updateOrder,
	deleteOrder,
} = require("./order.controller");
const { protect, admin } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, addOrder);
router.post("/payment/init", protect, initiateSslPayment);
router.post("/payment/success", sslPaymentSuccess);
router.get("/payment/success", sslPaymentSuccess);
router.post("/payment/fail", sslPaymentFail);
router.get("/payment/fail", sslPaymentFail);
router.post("/payment/cancel", sslPaymentCancel);
router.get("/payment/cancel", sslPaymentCancel);
router.post("/payment/ipn", sslPaymentIpn);
router.get("/payment/ipn", sslPaymentIpn);
router.get("/", protect, admin, getOrders);
router.get("/my-orders", protect, getOrdersForUser);
router.get("/:id", protect, admin, getOrderById);
router.put("/:id", protect, admin, updateOrder);
router.delete("/:id", protect, admin, deleteOrder);

module.exports = router;
