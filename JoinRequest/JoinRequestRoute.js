const express = require('express');
const JoinRequestController = require('./JoinRequestController');
const authmiddleware = require('../Config/Midelwere');
const JoinRequestRouter = express.Router();

JoinRequestRouter.post('/submit', JoinRequestController.submitRequest);
JoinRequestRouter.get('/all', authmiddleware, JoinRequestController.getAllRequests);
JoinRequestRouter.put('/:id/approve', authmiddleware, JoinRequestController.approveRequest);
JoinRequestRouter.put('/:id/reject', authmiddleware, JoinRequestController.rejectRequest);
JoinRequestRouter.get('/stats', authmiddleware, JoinRequestController.getStats);

module.exports = JoinRequestRouter;