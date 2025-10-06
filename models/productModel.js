const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }, // base price
  description: String,
  image: String,
  category: String,

  // Total stock (optional)
  stock: { type: Number, default: 0 },

  // Variants for color + stock + price + description
  variants: [
    {
      color: { type: String, required: true },
      stock: { type: Number, required: true, default: 0 },
      price: { type: Number, required: true },          // ✅ new
      description: { type: String }                     // ✅ new
    }
  ]
});

module.exports = mongoose.model('Product', productSchema);
