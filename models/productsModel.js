// models/Product.js
const mongoose = require("mongoose");

const productModelSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

const ProductModel = mongoose.model("ProductModel", productModelSchema);

module.exports = ProductModel;
