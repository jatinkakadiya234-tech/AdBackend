const express = require('express');
const CategoryCantroller = require('./CategoryController');
const CategoryAnalyticsController = require('./CategoryAnalyticsController');
const authmiddleware = require('../Config/Midelwere');

 const CategoryRoute = express.Router();

 CategoryRoute.post('/create', authmiddleware, CategoryCantroller.createCategory);
 CategoryRoute.get('/all', CategoryCantroller.getAllCategories);
 CategoryRoute.put('/toggle-status/:id', authmiddleware, CategoryCantroller.toggleCategoryStatus);
 CategoryRoute.put('/deactivate/:id', authmiddleware, CategoryCantroller.deactivateCategory);
 CategoryRoute.delete('/delete/:id', authmiddleware, CategoryCantroller.deleteCategory);
 CategoryRoute.put('/update/:id', authmiddleware, CategoryCantroller.editCategory);

 // Analytics routes
 CategoryRoute.get('/stats', CategoryAnalyticsController.getCategoryStats);
 CategoryRoute.get('/top', CategoryAnalyticsController.getTopCategories);
 CategoryRoute.get('/:id/ads', CategoryAnalyticsController.getAdsByCategory);
 CategoryRoute.get('/:id/trends', CategoryAnalyticsController.getCategoryTrends);

    module.exports = CategoryRoute;