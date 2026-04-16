const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const apiRoutes = require("./routes");
const { errorHandler } = require("./middlewares/error.middleware");
const env = require("./config/env");

const app = express();

app.use(
  cors({
    origin: env.frontendUri,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
  })
);

console.log(`CORS enabled for ${env.frontendUri}`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api", apiRoutes);
app.use(errorHandler);

module.exports = app;
