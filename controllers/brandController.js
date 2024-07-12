const Brand = require("../models/brand");
const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require("uuid");

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateBrandId = async () => {
  const brands = await Brand.find({}, { brandId: 1, _id: 0 }).sort({
    brandId: 1,
  });
  const brandIds = brands.map((brand) =>
    parseInt(brand.brandId.replace("brand", ""), 10)
  );

  let brandId = 1;
  for (let i = 0; i < brandIds.length; i++) {
    if (brandId < brandIds[i]) {
      break;
    }
    brandId++;
  }

  return `brand${String(brandId).padStart(4, "0")}`;
};
const generateProductId = async () => {
  // Retrieve all product IDs and sort them
  const brands = await Brand.find({}, { brandId: 1, _id: 0 }).sort({
    brandId: 1,
  });
  const brandIds = brands.map((brand) =>
    parseInt(brand.brandId.replace("brand", ""), 10)
  );

  let brandId = 1;
  for (let i = 0; i < brandIds.length; i++) {
    if (brandId < brandIds[i]) {
      break;
    }
    brandId++;
  }

  return `brand${String(brandId).padStart(4, "0")}`;
};

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer || fileBuffer.length === 0) {
      return reject({ message: "Empty file", http_code: 400 });
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "matrixsol/brand" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (public_id) => {
  try {
    if (public_id) {
      await cloudinary.uploader.destroy(public_id);
    }
  } catch (error) {
    throw error;
  }
};

const addBrand = async (req, res) => {
  try {
    const { brandname } = req.body;
    let brandimage = null;
    let public_id = null;

    if (req.files && req.files.brandimage) {
      const fileBuffer = req.files.brandimage.data;

      // Check if fileBuffer is not empty
      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(400).json({ message: "File is empty" });
      }

      try {
        const { secure_url, public_id: pid } = await uploadToCloudinary(
          fileBuffer
        );
        brandimage = secure_url;
        public_id = pid;
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Error uploading to Cloudinary", error });
      }
    } else {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const brandId = await generateBrandId();

    const newBrand = new Brand({
      brandId,
      brandname,
      brandimage,
      public_id, // Save public_id in the database
    });

    await newBrand.save();
    res.status(201).json(newBrand);
  } catch (error) {
    res.status(500).json({ message: "Error adding brand", error });
  }
};

const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving brands", error });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { brandname } = req.body;
    let brandimage = null;
    let public_id = null;

    if (req.files && req.files.brandimage) {
      const fileBuffer = req.files.brandimage.data;
      const { secure_url, public_id: pid } = await uploadToCloudinary(
        fileBuffer
      );
      brandimage = secure_url;
      public_id = pid;
    }

    const updatedBrand = await Brand.findOneAndUpdate(
      { brandId },
      { brandname, brandimage, public_id },
      { new: true }
    );

    res.status(200).json(updatedBrand);
  } catch (error) {
    res.status(500).json({ message: "Error updating brand", error });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { brandId } = req.params;

    // Find brand to get public_id
    const brandToDelete = await Brand.findOne({ brandId });
    if (!brandToDelete) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Delete image from Cloudinary using public_id
    await deleteFromCloudinary(brandToDelete.public_id);

    // Delete brand from database
    await Brand.findOneAndDelete({ brandId });
    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting brand", error });
  }
};

module.exports = {
  addBrand,
  getBrands,
  updateBrand,
  deleteBrand,
};
