const express = require('express');
const UserController = require('./UserController');
const UserRouter = express.Router();

UserRouter.post('/register', UserController.RagiterUser);
UserRouter.post('/login', UserController.Login);

module.exports = UserRouter;