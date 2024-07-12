// models/Category.js
const mongoose = require("mongoose");

const subSubCategorySchema = new mongoose.Schema({
  name: String,
});

const subCategorySchema = new mongoose.Schema({
  name: String,
  subsubcategories: [subSubCategorySchema],
});

const categorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      unique: true,
      required: true,
    },
    mainCategory: {
      type: String,
      unique: true,
      required: true,
    },
    subcategories: [subCategorySchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
