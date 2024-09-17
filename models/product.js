// models/Product.js
const mongoose = require("mongoose");

const SpecificationSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  details: {
    type: [String],
  },
});

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,

      unique: true,
    },
    categoryName: { type: String, required: true },
    subCategoryName: String,
    subSubCategoryName: String,
    title: { type: String, required: true },
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
    offerPrice: { type: String, default: "0" },
    inStockAvailable: { type: String },
    fullTitleDescription: [String],
    soldOutStock: { type: String },
    fullDescription: String,
    specifications: [SpecificationSchema],
    images: [String],
    productthumbnailimage: { type: String, required: true },
    active: { type: Boolean, default: true },
    isdraft: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
