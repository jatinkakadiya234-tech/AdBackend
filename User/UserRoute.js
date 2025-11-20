const express = require('express');
const UserController = require('./UserController');
const UserRouter = express.Router();

// Authentication Routes
UserRouter.post('/register', UserController.registerUser);
UserRouter.post('/login', UserController.login);
UserRouter.post('/logout', UserController.logout);

// Profile Management Routes
UserRouter.get('/profile', require('../Config/Midelwere'), UserController.getProfile);
UserRouter.put('/profile', require('../Config/Midelwere'), UserController.updateProfile);

// Device & Platform Routes
UserRouter.get('/by-device', require('../Config/Midelwere'), UserController.getUsersByDevice); // ?device=web/mobile&platform=html/react
UserRouter.get('/users', require('../Config/Midelwere'), UserController.getUsersByRole); // ?role=admin/advertiser/viewer/publisher

// Wallet Routes
UserRouter.post('/wallet/add', require('../Config/Midelwere'), UserController.addWalletBalance);
UserRouter.get('/wallet/transactions', require('../Config/Midelwere'), UserController.getWalletTransactions);
UserRouter.get('/wallet', require('../Config/Midelwere'), UserController.getWalletTransactions);

// Dashboard & Analytics Routes
UserRouter.get('/dashboard-stats', require('../Config/Midelwere'), UserController.getDashboardStats);
UserRouter.get('/advertiser-analytics', require('../Config/Midelwere'), UserController.getAdvertiserAnalytics);

// Publisher Profile Routes
UserRouter.get('/publisher/profile-status', require('../Config/Midelwere'), UserController.checkPublisherProfile);

// Admin Routes
UserRouter.get('/all', require('../Config/Midelwere'), UserController.getAllUsers);
UserRouter.post('/:id/toggle-status', require('../Config/Midelwere'), UserController.toggleUserStatus);
UserRouter.post('/:id/ban', require('../Config/Midelwere'), UserController.banUser);
UserRouter.post('/:id/unban', require('../Config/Midelwere'), UserController.unbanUser);
UserRouter.delete('/:id', require('../Config/Midelwere'), UserController.deleteUser);

module.exports = UserRouter;