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

// Wallet Routes
UserRouter.post('/wallet/add', require('../Config/Midelwere'), UserController.addWalletBalance);
UserRouter.get('/wallet/transactions', require('../Config/Midelwere'), UserController.getWalletTransactions);

module.exports = UserRouter;