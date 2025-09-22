const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },

  lastName: {
    type: String,
    required: true,
  },

  phoneNumber: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
  },

  password: {
    type: String,
    required: true,
  },

  address: {
    type: String,
    default: "",
  },

  role: {
    type: String,
    enum: ["user", "admin"],   // sirf do roles allowed
    default: "user",           // default normal user hoga
  },
}, { timestamps: true });       // createdAt, updatedAt auto add hoga

module.exports = mongoose.model("User", userSchema);
