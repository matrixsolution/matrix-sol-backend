const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");

router.post("/createbrand", brandController.addBrand);
router.get("/getbrand", brandController.getBrands);
router.put("/updatebrands/:brandId", brandController.updateBrand);
router.delete("/deletebrands/:brandId", brandController.deleteBrand);

module.exports = router;
