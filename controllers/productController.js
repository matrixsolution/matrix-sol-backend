// controllers/productController.js
const Product = require("../models/product");
const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require("uuid");

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload images to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "matrixsol" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Generate productId
const generateProductId = async () => {
  // Retrieve all product IDs and sort them
  const products = await Product.find({}, { productId: 1, _id: 0 }).sort({
    productId: 1,
  });
  const productIds = products.map((product) =>
    parseInt(product.productId.replace("productid", ""), 10)
  );

  let productId = 1;
  for (let i = 0; i < productIds.length; i++) {
    if (productId < productIds[i]) {
      break;
    }
    productId++;
  }

  return `productid${String(productId).padStart(4, "0")}`;
};

const createProduct = async (req, res) => {
  try {
    const {
      categoryName,
      subCategoryName,
      subSubCategoryName,
      title,
      brand,
      brandimage,
      modelNumber,
      price,
      offerPrice,
      discount,
      inStockAvailable,
      fullTitleDescription,
      soldOutStock,
      fullDescription,
      active,
      isdraft,
      specifications,
    } = req.body;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    if (!req.files.productthumbnailimage) {
      return res
        .status(400)
        .json({ message: "Product thumbnail image is required" });
    }

    const thumbnailImageFile = req.files.productthumbnailimage;
    const productThumbnailImage = await uploadToCloudinary(
      thumbnailImageFile.data
    );

    const imageUrls = [];
    const files = req.files.images;
    const fileArray = Array.isArray(files) ? files : [files];
    for (const file of fileArray) {
      const imageUrl = await uploadToCloudinary(file.data);
      imageUrls.push(imageUrl);
    }

    const productId = await generateProductId();

    const parsedSpecifications = specifications
      ? JSON.parse(specifications)
      : [];

    const parsedFullTitleDescription = fullTitleDescription
      ? fullTitleDescription.split(/\r?\n/)
      : [];

    const newProduct = new Product({
      productId,
      categoryName,
      subCategoryName,
      subSubCategoryName,
      title,
      brand,
      brandimage,
      modelNumber,
      price,
      offerPrice: offerPrice,
      discount,
      inStockAvailable,
      fullTitleDescription: parsedFullTitleDescription,
      soldOutStock,
      fullDescription,
      specifications: parsedSpecifications,
      images: imageUrls,
      productthumbnailimage: productThumbnailImage,
      active: active || false,
      isdraft: isdraft || false,
    });

    await newProduct.save();

    res
      .status(201)
      .json({ message: "Product created successfully", product: newProduct });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern.modelNumber) {
      return res.status(400).json({
        message:
          "This model number already exists. Please use a different model number.",
      });
    }

    console.error("Error creating product:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};
const toggleProductActiveState = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      return res.status(404).send("Product not found");
    }
    product.active = !product.active;
    if (!product.active) {
      product.inStockAvailable = 0;
      product.soldOutStock = 0;
    }

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error("Error toggling product active state:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Fetch product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product by ID:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// controllers/productController.js

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const {
      categoryName,
      subCategoryName,
      title,
      subSubCategoryName,
      brand,
      brandimage,
      modelNumber,
      price,
      discount,
      offerPrice,
      fullDescription,
      fullTitleDescription,
      specifications,
      inStockAvailable,
      soldOutStock,
      removedImages,
    } = req.body;

    let imageUrls = [];
    let productThumbnailImage = null;

    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Handle removal of existing images
    const removedImagesArray = JSON.parse(removedImages || "[]");
    if (removedImagesArray.length > 0) {
      for (const imageUrl of removedImagesArray) {
        const publicId = imageUrl.split("/").slice(-1)[0].split(".")[0];
        await cloudinary.uploader.destroy(publicId); // Remove from Cloudinary
      }

      // Remove the image URLs from the product's images field
      product.images = product.images.filter(
        (image) => !removedImagesArray.includes(image)
      );
    }

    // Handle new images (append to the existing image URLs)
    if (req.files && req.files.images) {
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
      for (const file of files) {
        const imageUrl = await uploadToCloudinary(file.data);
        product.images.push(imageUrl); // Append new image URLs
      }
    }

    imageUrls = product.images; // Assign updated image array to imageUrls

    // Handle the thumbnail update
    if (req.files && req.files.productthumbnailimage) {
      if (product.productthumbnailimage) {
        const publicId = product.productthumbnailimage
          .split("/")
          .slice(-1)[0]
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
      const thumbnailImageFile = req.files.productthumbnailimage;
      productThumbnailImage = await uploadToCloudinary(thumbnailImageFile.data);
    } else {
      productThumbnailImage = product.productthumbnailimage; // Keep existing thumbnail if not updated
    }

    // Parse specifications and full title description
    const parsedSpecifications = specifications
      ? JSON.parse(specifications)
      : [];

    const parsedFullTitleDescription = fullTitleDescription
      ? fullTitleDescription.split(/\r?\n/)
      : [];

    // Update product with new data
    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      {
        categoryName,
        subCategoryName,
        subSubCategoryName,
        title,
        brand,
        brandimage,
        modelNumber,
        price,
        offerPrice,
        discount,
        inStockAvailable,
        fullTitleDescription: parsedFullTitleDescription,
        soldOutStock,
        fullDescription,
        specifications: parsedSpecifications,
        images: imageUrls,
        productthumbnailimage: productThumbnailImage,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// delete function

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Delete product from database
    const deletedProduct = await Product.findOneAndDelete({ productId });

    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete images from Cloudinary
    for (const imageUrl of deletedProduct.images) {
      const publicId = imageUrl.split("/").slice(-1)[0].split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const decodeFromUrl = (str) => {
  return decodeURIComponent(str)
    .replace(/-slash-/g, "/") // Replace "-slash-" back to "/"
    .replace(/-at-/g, "@") // Replace "-at-" back to "@"
    .replace(/-and-/g, "&") // Replace "-and-" back to "&"
    .replace(/-backslash-/g, "\\") // Replace "-backslash-" back to "\"
    .replace(/-percent-/g, "%"); // Replace "-percent-" back to "%"
};

// Fetch products by category
const getProductsByCategory = async (req, res) => {
  try {
    const decodedCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.categoryName)
    );
    const products = await Product.find({
      categoryName: decodedCategoryName,
      isdraft: false,
    });
    if (!products.length) {
      return res
        .status(404)
        .json({ error: "No products found for this category" });
    }
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by category:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Fetch products by category and subcategory
const getProductsBysubCategory = async (req, res) => {
  try {
    const decodedCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.categoryName)
    );
    const decodedSubCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.subCategoryName)
    );
    const products = await Product.find({
      categoryName: decodedCategoryName,
      subCategoryName: decodedSubCategoryName,
      isdraft: false,
    });
    if (!products.length) {
      return res
        .status(404)
        .json({ error: "No products found for this subcategory" });
    }
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by subcategory:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getProductsBysubsubCategory = async (req, res) => {
  try {
    const decodedCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.categoryName)
    );
    const decodedSubCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.subCategoryName)
    );
    const decodedSubSubCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.subSubCategoryName)
    );

    const products = await Product.find({
      categoryName: decodedCategoryName,
      subCategoryName: decodedSubCategoryName,
      subSubCategoryName: decodedSubSubCategoryName,
      isdraft: false,
    });

    if (!products.length) {
      return res
        .status(404)
        .json({ error: "No products found for this subsubcategory" });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by subsubcategory:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};
// Fetch products by brand
const getProductsByBrand = async (req, res) => {
  try {
    const decodeBrand = decodeFromUrl(decodeURIComponent(req.params.brand));
    const products = await Product.find({
      brand: decodeBrand,
      isdraft: false,
    });
    if (!products.length) {
      return res
        .status(404)
        .json({ error: "No products found for this brand" });
    }
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by brand:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  toggleProductActiveState,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsBysubCategory,
  getProductsByBrand,
  getProductsBysubsubCategory,
};

/*
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const {
      categoryName,
      subCategoryName,
      title,
      subSubCategoryName,
      shortDescription,
      bulletPoints,
      brand,
      brandimage,
      modelNumber,
      price,
      offerPrice,
      discount,
      fullDescription,
    } = req.body;

    // Initialize arrays for image URLs and the product thumbnail image URL
    let imageUrls = [];
    let productThumbnailImage = null;

    // Fetch the existing product
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Handle new image uploads if present
    if (req.files && req.files.images) {
      // Delete existing images from Cloudinary
      if (product.images.length > 0) {
        for (const imageUrl of product.images) {
          const publicId = imageUrl.split("/").slice(-1)[0].split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }
      }

      // Upload new images to Cloudinary
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
      for (const file of files) {
        const imageUrl = await uploadToCloudinary(file.data);
        imageUrls.push(imageUrl);
      }
    } else {
      // No new images uploaded, keep existing ones
      imageUrls = product.images;
    }

    // Handle the thumbnail image
    if (req.files && req.files.productthumbnailimage) {
      // Delete existing thumbnail image from Cloudinary
      if (product.productthumbnailimage) {
        const publicId = product.productthumbnailimage
          .split("/")
          .slice(-1)[0]
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Upload new thumbnail image to Cloudinary
      const thumbnailImageFile = req.files.productthumbnailimage;
      productThumbnailImage = await uploadToCloudinary(thumbnailImageFile.data);
    } else {
      // No new thumbnail image uploaded, keep existing one
      productThumbnailImage = product.productthumbnailimage;
    }

    // Split shortDescription and bulletPoints by commas
    const shortDescriptionArray = shortDescription.split(",");
    const bulletPointsArray = bulletPoints.split(",");

    // Update product in database
    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      {
        categoryName,
        subCategoryName,
        title,
        subSubCategoryName,
        shortDescription: shortDescriptionArray,
        bulletPoints: bulletPointsArray,
        brand,
        brandimage,
        modelNumber,
        price,
        offerPrice,
        discount,
        fullDescription,
        images: imageUrls,
        productthumbnailimage: productThumbnailImage,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};
*/
