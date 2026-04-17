const Cart = require("./cart.model");

const getCartCount = (products = []) => products.length;
const getCartQuantity = (products = []) =>
  products.reduce((total, item) => total + (item.quantity || 0), 0);

const mergeCartProducts = (carts = []) => {
  const productMap = new Map();

  carts.forEach((cart) => {
    (cart.products || []).forEach((item) => {
      const key = item.productId.toString();
      const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;

      if (productMap.has(key)) {
        productMap.get(key).quantity += quantity;
      } else {
        productMap.set(key, {
          productId: item.productId,
          quantity,
        });
      }
    });
  });

  return Array.from(productMap.values());
};

const findCartContainingProduct = async (userId, productId) => {
  return Cart.findOne({ userId, "products.productId": productId });
};

const addToCart = async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "productId is required" });
  }

  try {
    const addQuantity = Number(quantity) > 0 ? Number(quantity) : 1;

    // Prefer the cart that already has this product, otherwise reuse any existing user cart.
    let cartItem = await Cart.findOne({ userId, "products.productId": productId });

    if (!cartItem) {
      cartItem = await Cart.findOne({ userId });
    }

    if (!cartItem) {
      cartItem = new Cart({
        userId,
        products: [{ productId, quantity: addQuantity }],
      });
      await cartItem.save();
    } else {
      const productIndex = cartItem.products.findIndex(
        (item) => item.productId.toString() === productId.toString()
      );

      if (productIndex > -1) {
        cartItem.products[productIndex].quantity += addQuantity;
      } else {
        cartItem.products.push({ productId, quantity: addQuantity });
      }

      await cartItem.save();
    }

    res.status(200).json({
      message: "Product added to cart successfully",
      cartCount: getCartCount(cartItem.products),
      totalQuantity: getCartQuantity(cartItem.products),
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCartByUserId = async (req, res) => {
  const userId = req.user._id;

  try {
    const userCarts = await Cart.find({ userId }).sort({ createdAt: 1 });

    if (!userCarts.length) {
      return res.status(200).json([]);
    }

    // Handle existing duplicate cart documents gracefully by merging products.
    const mergedProducts = mergeCartProducts(userCarts);
    const baseCart = userCarts[0];

    res.status(200).json([
      {
        ...baseCart.toObject(),
        products: mergedProducts,
        cartCount: getCartCount(mergedProducts),
        totalQuantity: getCartQuantity(mergedProducts),
      },
    ]);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const removeFromCart = async (req, res) => {
  const userId = req.user._id;
  const productId = req.params.productId || req.query.productId || req.body.productId;

  if (!productId) {
    return res.status(400).json({ message: "productId is required" });
  }

  try {
    const cartItem = await findCartContainingProduct(userId, productId);
    if (!cartItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }
    const productIndex = cartItem.products.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );
    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }
    cartItem.products.splice(productIndex, 1);
    await cartItem.save();

    res.status(200).json({
      message: "Product removed from cart successfully",
      cartCount: getCartCount(cartItem.products),
      totalQuantity: getCartQuantity(cartItem.products),
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateCart = async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "productId is required" });
  }

  try {
    const cartItem = await findCartContainingProduct(userId, productId);
    if (!cartItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }
    const productIndex = cartItem.products.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );
    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }
    cartItem.products[productIndex].quantity = quantity;
    await cartItem.save();

    res.status(200).json({
      message: "Cart updated successfully",
      cartCount: getCartCount(cartItem.products),
      totalQuantity: getCartQuantity(cartItem.products),
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  addToCart,
  getCartByUserId,
  removeFromCart,
  updateCart,
};
