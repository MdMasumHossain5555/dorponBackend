const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
  getMe,
  updateUserProfile,
} = require("./auth.controller");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", getMe);
router.get("/profile", getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.post("/logout", logoutUser);

module.exports = router;
