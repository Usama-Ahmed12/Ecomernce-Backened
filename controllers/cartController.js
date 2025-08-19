const cartService = require("../Services/cartservice");

// ✅ Add to cart
const addToCart = async (req, res) => {
  try {
    const resp = await cartService.addToCart({
      userId: req.user.userId, // ✅ JWT payload
      productId: req.body.productId,
      quantity: req.body.quantity,
    });

    return res.status(resp.statusCode || 200).json({
      success: resp.success,
      message: resp.message,
      data: resp.data || null,
    });
  } catch (error) {
    console.error("Add to cart error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while adding to cart",
    });
  }
};

// ✅ Get user's cart
const getCart = async (req, res) => {
  try { 
    const resp = await cartService.getCart({ userId: req.user.userId });

    return res.status(resp.statusCode || 200).json({
      success: resp.success,
      message: resp.message,
      data: resp.data || null,
    });
  } catch (error) {
    console.error("Get cart error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching cart",
    });
  }
};

module.exports = { addToCart, getCart };
