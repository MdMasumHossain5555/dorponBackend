const Product = require("./product.model");
const { parseArrayField, buildProductImages } = require("./product.service");

exports.getProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

exports.addProducts = async (req, res) => {
  const { name, sku, price, description, category } = req.body;
  const features = parseArrayField(req.body.features);
  const colors = parseArrayField(req.body.colors);
  const imageFiles = Array.isArray(req.files) ? req.files : [];
  const bodyImages = parseArrayField(req.body.images);

  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof price !== "string" ||
    price.trim() === "" ||
    (imageFiles.length === 0 && bodyImages.length === 0) ||
    typeof description !== "string" ||
    description.trim() === "" ||
    typeof category !== "string" ||
    category.trim() === ""
  ) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }

  const images = await buildProductImages(imageFiles, bodyImages);

  const product = new Product({
    name,
    sku: sku || "fdsfd",
    price,
    images,
    description,
    reviews: 0,
    rating: 0,
    category,
    features,
    colors,
  });

  await product.save();
  res.status(201).json(product);
};

exports.getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
};

exports.updateProduct = async (req, res) => {
  const { name, price, description, category, rating, sku } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.category = category || product.category;
    product.rating = rating || product.rating;
    product.sku = sku || product.sku;

    if (req.body.features !== undefined) {
      product.features = parseArrayField(req.body.features);
    }

    if (req.body.colors !== undefined) {
      product.colors = parseArrayField(req.body.colors);
    }

    if (Array.isArray(req.files) && req.files.length > 0) {
      const images = await buildProductImages(req.files, product.images);

      // Replace existing images only when the client sends a new image set.
      product.images = images;
    } else if (req.body.images !== undefined) {
      product.images = parseArrayField(req.body.images);
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
};
