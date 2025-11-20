const JoinRequest = require('./JoinRequestModel');
const User = require('../User/UserModel');

const JoinRequestController = {
  submitRequest: async (req, res) => {
    try {
      const { fullName, email, phone, role, companyName, website } = req.body;
      
      const existingRequest = await JoinRequest.findOne({ email });
      if (existingRequest) {
        return res.status(400).json({ message: "Request already exists for this email" });
      }

      const newRequest = new JoinRequest({
        fullName,
        email,
        phone,
        role,
        companyName,
        website
      });

      await newRequest.save();
      res.status(201).json({ message: "Join request submitted successfully" });
    } catch (error) {
      console.log('Error in submitRequest:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllRequests: async (req, res) => {
    try {
      const requests = await JoinRequest.find().sort({ submittedAt: -1 });
      res.status(200).json({ requests });
    } catch (error) {
      console.log('Error in getAllRequests:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  approveRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const request = await JoinRequest.findById(id);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      request.status = 'approved';
      request.reviewedBy = req.user.id;
      request.reviewedAt = new Date();
      await request.save();

      res.status(200).json({ message: "Request approved successfully" });
    } catch (error) {
      console.log('Error in approveRequest:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  rejectRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const request = await JoinRequest.findById(id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      request.status = 'rejected';
      request.rejectionReason = reason;
      request.reviewedBy = req.user.id;
      request.reviewedAt = new Date();
      await request.save();

      res.status(200).json({ message: "Request rejected successfully" });
    } catch (error) {
      console.log('Error in rejectRequest:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getStats: async (req, res) => {
    try {
      const totalRequests = await JoinRequest.countDocuments();
      console.log('Total Requests:', totalRequests);
      const pendingRequests = await JoinRequest.countDocuments({ status: 'pending' });
      console.log('Pending Requests:', pendingRequests);
      const approvedRequests = await JoinRequest.countDocuments({ status: 'approved' });
      console.log('Approved Requests:', approvedRequests);
      const rejectedRequests = await JoinRequest.countDocuments({ status: 'rejected' });

      console.log('Rejected Requests:', rejectedRequests); 

      res.status(200).json({
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests
      });
    } catch (error) {
      console.log('Error in getStats:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = JoinRequestController;