const Joi = require("joi");

// ✅ Validation schema for creating an order
const createOrderSchema = Joi.object({
  // Future: agar tum payment method, shipping address waghera add karna chaho to yahan include karna
  userId: Joi.string().required().messages({
    "any.required": "User ID is required to create an order",
    "string.empty": "User ID cannot be empty",
  }),
});

module.exports = { createOrderSchema };
