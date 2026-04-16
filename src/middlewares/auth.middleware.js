const jwt = require("jsonwebtoken");
const User = require("../modules/auth/user.model");
const env = require("../config/env");

const getTokenFromRequest = (req) => {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
};

const protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    res.status(401).json({ message: "No token, authorization denied" });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401).json({ message: "Not authorized, user not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

const admin = async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: "No token, authorization denied" });
    return;
  }

  if (!req.user.isAdmin) {
    res.status(403).json({ message: "Not authorized as an admin" });
    return;
  }

  next();
};

module.exports = { protect, admin };
