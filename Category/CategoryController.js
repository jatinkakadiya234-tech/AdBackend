
const Category = require("./CategoryModel");
const Ad = require('../Ad-banner/AdBanner');
const CategoryCantroller ={
    createCategory: async (req, res) => {
        try {
            const { name, description, isActive, type } = req.body;
            
            if (!name) {
                return res.status(400).json({ message: "Category name is required" });
            }
            
            // Generate slug from name
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            
            const newCategory = new Category({ 
                name, 
                description: description || '',
                slug: slug,
                active: isActive !== undefined ? isActive : true,
                type: type || 'banner'
            });
            await newCategory.save();
            res.status(201).json({ message: "Category created successfully", category: newCategory });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ message: "Category name already exists" });
            }
            res.status(500).json({ message: "Error creating category", error: error.message });
        }   
    },
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.find().sort({ createdAt: -1 });
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
        
        // If category is being deactivated, deactivate all related ads
        if (!status) {
          await Ad.updateMany(
            { category: id },
            { isActive: false }
          );
        }
        
        res.status(200).json({ 
          message: "Category status updated", 
          category,
          adsDeactivated: !status
        });
      
     
    }
    catch (error) {
        res.status(500).json({ message: "Error updating category status", error: error.message });
    }
},
deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Strictly prevent deletion of inactive categories
      if (category.active === false) {
        return res.status(403).json({ 
          message: "Inactive category cannot be deleted. Only status can be changed.",
          error: "INACTIVE_CATEGORY_DELETE_FORBIDDEN"
        });
      }
      
      await Category.findByIdAndDelete(id);
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting category", error: error.message });
    }
  },

editCategory: async (req, res) => {
    try {
      const { id } = req.params;    
        const { name, description, active, type } = req.body;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        
        category.name = name || category.name;
        category.description = description !== undefined ? description : category.description;
        category.active = active !== undefined ? active : category.active;
        category.type = type || category.type;
        
        // If category is being deactivated, deactivate all related ads
        if (active === false) {
          await Ad.updateMany(
            { category: id },
            { isActive: false }
          );
        }
        
        await category.save();
        res.status(200).json({ 
          message: "Category updated successfully", 
          category,
          adsDeactivated: active === false
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating category", error: error.message });
    }   
},

deactivateCategory: async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        
        category.active = false;
        await category.save();
        
        // Deactivate all related ads
        await Ad.updateMany(
            { category: id },
            { isActive: false }
        );
        
        res.status(200).json({ 
            message: "Category deactivated successfully", 
            category,
            adsDeactivated: true
        });
    } catch (error) {
        res.status(500).json({ message: "Error deactivating category", error: error.message });
    }
}




}

module.exports = CategoryCantroller;
