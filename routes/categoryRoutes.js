// routes/categoryRoutes.js
const express = require("express");
const {
  createMainCategory,
  addSubCategory,
  addSubSubCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const router = express.Router();

router.post("/main", createMainCategory);
router.post("/sub", addSubCategory);
router.post("/subsub", addSubSubCategory);
router.get("/getcategory", getCategories);
router.put("/updatecategory", updateCategory);
router.delete("/deletecategory", deleteCategory);

module.exports = router;
