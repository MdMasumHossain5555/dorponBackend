const mongoose = require("mongoose");

const carouselSkema = new mongoose.Schema(
  {
    image: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("carousel", carouselSkema);
