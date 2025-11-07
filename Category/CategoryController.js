
const Category = require("./CategoryModel");

const CategoryCantroller ={
    createCategory: async (req, res) => {
        try {
            const { name, slug } = req.body;
            const newCategory = new Category({ name, slug });
            await newCategory.save();
            res.status(201).json({ message: "Category created successfully", category: newCategory });
        } catch (error) {
            res.status(500).json({ message: "Error creating category", error: error.message });
        }   
    },
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.find();
            res.status(200).json({ categories });
        } catch (error) {
            res.status(500).json({ message: "Error fetching categories", error: error.message });
        }

    },
    
  toggleCategoryStatus: async (req, res) => {
    try {
      const { id } = req.params;
      let {status} = req.body;
      const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }   
        category.active = status;
        await category.save();
        res.status(200).json({ message: "Category status updated", category });
      
     
    }
    catch (error) {
        res.status(500).json({ message: "Error updating category status", error: error.message });
    }
},
deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findByIdAndDelete(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting category", error: error.message });
    }
  },

editCategory: async (req, res) => {
    try {
      const { id } = req.params;    
        const { name, slug } = req.body;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        category.name = name || category.name;
        category.slug = slug || category.slug;
        await category.save();
        res.status(200).json({ message: "Category updated successfully", category });
    } catch (error) {
        res.status(500).json({ message: "Error updating category", error: error.message });
    }   
  }
}

module.exports = CategoryCantroller;
