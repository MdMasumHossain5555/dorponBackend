const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const {
  registerUser,
  loginUser,
  getUserProfile,
  getUsers,
  updateUserByAdmin,
  deleteUser,
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
router.get("/users", getUsers);
router.put("/users/:id", updateUserByAdmin);
router.delete("/users/:id", deleteUser);
router.post("/logout", logoutUser);

module.exports = router;
