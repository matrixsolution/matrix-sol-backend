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
      title,
      subSubCategoryName,
      shortDescription,
      bulletPoints,
      brand,
      brandimage, // Extract brandImage from the request body
      modelNumber,
      price,
      discount,
      fullDescription,
      active, // Frontend should provide this
      isdraft,
    } = req.body;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }
    if (!req.files || !req.files.productthumbnailimage) {
      return res
        .status(400)
        .json({ message: "Product thumbnail image is required" });
    }

    const thumbnailImageFile = req.files.productthumbnailimage;

    const productThumbnailImage = await uploadToCloudinary(
      thumbnailImageFile.data
    );

    // Upload images to Cloudinary
    const imageUrls = [];
    const files = req.files.images;
    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      const imageUrl = await uploadToCloudinary(file.data);
      imageUrls.push(imageUrl);
    }

    // Create productId
    const productId = await generateProductId();

    // Split shortDescription and bulletPoints by commas
    const shortDescriptionArray = shortDescription.split(",");
    const bulletPointsArray = bulletPoints.split(",");

    // Create new product
    const newProduct = new Product({
      productId,
      categoryName,
      subCategoryName,
      images: imageUrls,
      productthumbnailimage: productThumbnailImage,
      title,
      subSubCategoryName,
      shortDescription: shortDescriptionArray,
      bulletPoints: bulletPointsArray,
      brand,
      brandimage, // Include brandImage in the new product
      modelNumber,
      price,
      discount,
      fullDescription,

      active: active || false, // Ensure active defaults to false if not provided
      isdraft: isdraft || false,
    });

    await newProduct.save();
    res
      .status(201)
      .json({ message: "Product created successfully", newProduct });
  } catch (error) {
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
      shortDescription,
      bulletPoints,
      brand,
      brandimage,
      modelNumber,
      price,
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
const getProductsByCategory = async (req, res) => {
  try {
    const product = await Product.find({
      categoryName: req.params.categoryName,
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product by ID:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};
const getProductsBysubCategory = async (req, res) => {
  try {
    const products = await Product.find({
      categoryName: req.params.categoryName,
      subCategoryName: req.params.subCategoryName,
    });
    if (!products.length) {
      return res.status(404).json({ error: "No products found" });
    }
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by subcategory:", error.message);
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
};
