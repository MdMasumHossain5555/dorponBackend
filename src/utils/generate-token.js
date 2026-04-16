const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateToken = (userId, isAdmin) => {
  return jwt.sign({ id: userId, isAdmin: isAdmin }, env.jwtSecret, {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
