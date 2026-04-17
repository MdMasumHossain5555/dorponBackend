const { protect } = require("../../middlewares/auth.middleware");
const User = require("./user.model");
const generateToken = require("../../utils/generate-token");

exports.registerUser = async (req, res) => {
  const { first_name, last_name, email, number, password, address } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "User already exists" });

  const user = await User.create({
    first_name,
    last_name,
    email,
    number,
    address,
    password,
    cart: [],
  });
  const token = generateToken(user.id);
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(201).json({
    _id: user.id,
    name: user.name,
    email: user.email,
  });
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user.id, user.isAdmin);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

exports.getMe = [
  protect,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("-password");
      if (user) {
        res.json({
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          number: user.number,
          address: user.address || "",
          isAdmin: user.isAdmin || false,
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  },
];

exports.getUserProfile = [
  protect,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("-password");
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  },
];

exports.getUsers = [
  protect,
  async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized as an admin" });
      }

      const users = await User.find().select("-password");
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to load users" });
    }
  },
];

exports.deleteUser = [
  protect,
  async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized as an admin" });
      }

      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  },
];

exports.updateUserByAdmin = [
  protect,
  async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized as an admin" });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { first_name, last_name, email, number, address, isAdmin } = req.body;

      user.first_name = first_name ?? user.first_name;
      user.last_name = last_name ?? user.last_name;
      user.email = email ?? user.email;
      user.number = number ?? user.number;
      user.address = address ?? user.address;
      if (typeof isAdmin === "boolean") {
        user.isAdmin = isAdmin;
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        number: updatedUser.number,
        address: updatedUser.address || "",
        isAdmin: updatedUser.isAdmin,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  },
];

exports.logoutUser = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

exports.updateUserProfile = async (req, res) => {
  const { first_name, last_name, email, number, address } = req.body;
  const user = await User.findById(req.user._id);
  if (user) {
    user.first_name = first_name || user.first_name;
    user.last_name = last_name || user.last_name;
    user.email = email || user.email;
    user.number = number || user.number;
    user.address = address !== undefined ? address : user.address;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      number: updatedUser.number,
      address: updatedUser.address || "",
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};
