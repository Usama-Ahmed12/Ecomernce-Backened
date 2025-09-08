// validation/authValidation.js
const Joi = require('joi');

// === Register validation schema ===
const registerSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters long"
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email"
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters long"
  })
});

// === Login validation schema ===
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email"
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required"
  })
});
// ✅ Refresh Token Schema
const refreshTokenSchema = Joi.object({
  token: Joi.string().required()
});

module.exports = { registerSchema, loginSchema, refreshTokenSchema };
