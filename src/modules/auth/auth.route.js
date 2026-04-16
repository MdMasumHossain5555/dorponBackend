const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
} = require("./auth.controller");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", getUserProfile);
router.get("/logout", logoutUser);

module.exports = router;
