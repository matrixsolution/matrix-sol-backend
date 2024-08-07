// routes/productRoutes.js
const express = require("express");
const {
  createProduct,
  getAllProducts,
  toggleProductActiveState,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsBysubCategory,
} = require("../controllers/productController");

const router = express.Router();

router.post("/add", createProduct);
router.get("/all", getAllProducts);
router.put("/toggle-active/:productId", toggleProductActiveState);
router.get("/:productId", getProductById);
router.get("/category/:categoryName", getProductsByCategory);
router.get(
  "/category/:categoryName/subcategory/:subCategoryName",
  getProductsBysubCategory
);

router.put("/update/:productId", updateProduct);
router.delete("/delete/:productId", deleteProduct);
module.exports = router;
