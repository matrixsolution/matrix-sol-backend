const Category = require("../models/category");

const generateCategoryId = async () => {
  const count = await Category.countDocuments();
  return `category${String(count + 1).padStart(4, "0")}`;
};

const createMainCategory = async (req, res) => {
  try {
    const { mainCategory } = req.body;

    const categoryId = await generateCategoryId();
    const newCategory = new Category({
      categoryId,
      mainCategory,
      subcategories: [],
    });

    await newCategory.save();
    res
      .status(201)
      .json({ message: "Main category created successfully", newCategory });
  } catch (error) {
    console.error("Error creating main category:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const addSubCategory = async (req, res) => {
  try {
    const { mainCategory, subCategoryName } = req.body;

    const category = await Category.findOne({ mainCategory });
    if (!category) {
      return res.status(404).json({ message: "Main category not found" });
    }

    category.subcategories.push({
      name: subCategoryName,
      subsubcategories: [],
    });
    await category.save();
    res
      .status(201)
      .json({ message: "Subcategory added successfully", category });
  } catch (error) {
    console.error("Error adding subcategory:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const addSubSubCategory = async (req, res) => {
  try {
    const { mainCategory, subCategoryName, subSubCategoryName } = req.body;

    const category = await Category.findOne({ mainCategory });
    if (!category) {
      return res.status(404).json({ message: "Main category not found" });
    }

    const subCategory = category.subcategories.find(
      (sub) => sub.name === subCategoryName
    );
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    subCategory.subsubcategories.push({ name: subSubCategoryName });
    await category.save();
    res
      .status(201)
      .json({ message: "Subsubcategory added successfully", category });
  } catch (error) {
    console.error("Error adding subsubcategory:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const {
      mainCategory,
      newMainCategory,
      subCategoryName,
      newSubCategoryName,
      subSubCategoryName,
      newSubSubCategoryName,
    } = req.body;

    const category = await Category.findOne({ mainCategory });
    if (!category) {
      return res.status(404).json({ message: "Main category not found" });
    }

    if (newMainCategory) {
      category.mainCategory = newMainCategory;
    }

    if (subCategoryName && newSubCategoryName) {
      const subCategory = category.subcategories.find(
        (sub) => sub.name === subCategoryName
      );
      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      subCategory.name = newSubCategoryName;
    }

    if (subSubCategoryName && newSubSubCategoryName) {
      const subCategory = category.subcategories.find((sub) =>
        sub.subsubcategories.find(
          (subSub) => subSub.name === subSubCategoryName
        )
      );
      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      const subSubCategory = subCategory.subsubcategories.find(
        (subSub) => subSub.name === subSubCategoryName
      );
      if (!subSubCategory) {
        return res.status(404).json({ message: "Subsubcategory not found" });
      }
      subSubCategory.name = newSubSubCategoryName;
    }

    await category.save();
    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Error updating category:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { mainCategory, subCategoryName, subSubCategoryName } = req.body;

    if (mainCategory && !subCategoryName && !subSubCategoryName) {
      await Category.deleteOne({ mainCategory });
      return res
        .status(200)
        .json({ message: "Main category deleted successfully" });
    }

    const category = await Category.findOne({ mainCategory });
    if (!category) {
      return res.status(404).json({ message: "Main category not found" });
    }

    if (subCategoryName && !subSubCategoryName) {
      const subCategoryIndex = category.subcategories.findIndex(
        (sub) => sub.name === subCategoryName
      );
      if (subCategoryIndex === -1) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      category.subcategories.splice(subCategoryIndex, 1);
      await category.save();
      return res
        .status(200)
        .json({ message: "Subcategory deleted successfully", category });
    }

    if (subCategoryName && subSubCategoryName) {
      const subCategory = category.subcategories.find(
        (sub) => sub.name === subCategoryName
      );
      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      const subSubCategoryIndex = subCategory.subsubcategories.findIndex(
        (subSub) => subSub.name === subSubCategoryName
      );
      if (subSubCategoryIndex === -1) {
        return res.status(404).json({ message: "Subsubcategory not found" });
      }
      subCategory.subsubcategories.splice(subSubCategoryIndex, 1);
      await category.save();
      return res
        .status(200)
        .json({ message: "Subsubcategory deleted successfully", category });
    }

    res.status(400).json({ message: "Invalid delete request" });
  } catch (error) {
    console.error("Error deleting category:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createMainCategory,
  addSubCategory,
  addSubSubCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
