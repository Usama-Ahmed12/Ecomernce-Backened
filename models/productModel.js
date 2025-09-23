const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  image: String,
  category: String,
  
  // ✅ Total stock (optional: can auto-calc from variants)
  stock: { type: Number, default: 0 },

  // ✅ Variants for color + stock
  variants: [
    {
      color: { type: String, required: true },
      stock: { type: Number, required: true, default: 0 }
    }
  ]
});

module.exports = mongoose.model('Product', productSchema);
