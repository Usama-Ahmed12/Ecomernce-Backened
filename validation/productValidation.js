const Joi = require("joi");

// ✅ Product creation schema
const createProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.base": "Product name should be a type of text",
    "string.empty": "Product name cannot be empty",
    "string.min": "Product name should have at least 3 characters",
    "any.required": "Product name is required",
  }),

  description: Joi.string().min(5).max(500).required().messages({
    "string.empty": "Description cannot be empty",
    "string.min": "Description should have at least 5 characters",
    "any.required": "Description is required",
  }),

  price: Joi.number().positive().precision(2).required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be a positive number",
    "any.required": "Price is required",
  }),

  category: Joi.string().required().messages({
    "string.empty": "Category is required",
    "any.required": "Category is required",
  }),

  stock: Joi.number().integer().min(0).required().messages({
    "number.base": "Stock must be a number",
    "number.min": "Stock cannot be negative",
    "any.required": "Stock is required",
  }),

  // ✅ optional (kyunki upload ke through bhi image aa sakti hai)
  image: Joi.string().optional(),
});

module.exports = {
  createProductSchema,
};
