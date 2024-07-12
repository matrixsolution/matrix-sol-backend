// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,

      unique: true,
    },
    categoryName: { type: String, required: true },
    subCategoryName: String,
    images: [String],
    productthumbnailimage: { type: String, required: true },
    title: { type: String, required: true },
    subSubCategoryName: String,
    shortDescription: [String],
    bulletPoints: [String],
    brand: {
      type: String,
      required: true,
    },
    brandimage: {
      type: String,
      required: true,
    },
    modelNumber: { type: String, required: true, unique: true },
    price: { type: String, required: true },
    discount: String,
    fullDescription: String,
    active: { type: Boolean, default: true },
    isdraft: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
