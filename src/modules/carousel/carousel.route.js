const express = require("express");
const { getCarousel, addCarousel } = require("./carousel.controller");
const { protect, admin } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", getCarousel);
router.post("/", protect, admin, addCarousel);

module.exports = router;
