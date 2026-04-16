const mongoose = require("mongoose");

const productSkema = new mongoose.Schema(
  {
    name: String,
    sku: String,
    price: Number,
    oldPrice: Number,
    images: [
      {
        type: String,
      },
    ],
    category: String,
    reviews: Number,
    rating: Number,
    description: String,
    features: [
      {
        type: String,
      },
    ],
    colors: [
      {
        type: String,
      },
    ],
    slug: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("product", productSkema);
