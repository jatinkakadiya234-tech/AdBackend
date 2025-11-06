const express = require('express');
const CategoryCantroller = require('./CategoryController');

 const CategoryRoute = express.Router();

 CategoryRoute.post('/create', CategoryCantroller.createCategory);
 CategoryRoute.get('/all', CategoryCantroller.getAllCategories);
 CategoryRoute.put('/toggle-status/:id', CategoryCantroller.toggleCategoryStatus);
 CategoryRoute.delete('/delete/:id', CategoryCantroller.deleteCategory);
 CategoryRoute.put('/edit/:id', CategoryCantroller.editCategory);

    module.exports = CategoryRoute;