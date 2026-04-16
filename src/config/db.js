const mongoose = require("mongoose");
const env = require("./env");

const connectDB = () => {
  mongoose
    .connect(env.databaseUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB connectioin error :", err));
};

module.exports = connectDB;
