const Campaign = require('./CampaignModel');
const User = require('../User/UserModel');

const CampaignController = {
  // Create new campaign
  createCampaign: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      
      if (!user || user.role !== 'publisher') {
        return res.status(403).json({ message: "Only publishers can create campaigns" });
      }

      let campaignData;
      
      // Handle FormData (with image) or JSON data
      if (req.body.campaignData) {
        campaignData = JSON.parse(req.body.campaignData);
      } else {
        campaignData = req.body;
      }

      const {
        name,
        description,
        campaignDetails,
        targeting,
        adCreatives
      } = campaignData;

      if (!name || !campaignDetails || !adCreatives || adCreatives.length === 0) {
        return res.status(400).json({ 
          message: "Campaign name, details, and at least one ad creative are required" 
        });
      }

      // Handle image upload
      if (req.file) {
        adCreatives[0].imageUrl = `/uploads/${req.file.filename}`;
        adCreatives[0].mediaType = 'image';
      }

      const newCampaign = new Campaign({
        name: name.trim(),
        description: description?.trim(),
        createdBy: userId,
        campaignDetails: {
          ...campaignDetails,
          budget: { type: 'daily', amount: 100, currency: 'USD' },
          schedule: { startDate: new Date(), timeZone: 'UTC' },
          bidding: { strategy: 'cpc', amount: 0.5 }
        },
        targeting: targeting || {
          demographics: { ageRange: { min: 18, max: 65 }, gender: 'all' },
          devices: ['desktop', 'mobile']
        },
        adCreatives,
        status: 'pending_review',
        reviewProcess: {
          submittedAt: new Date(),
          reviewHistory: [{
            action: 'submitted',
            date: new Date(),
            notes: 'Campaign automatically submitted for review upon creation'
          }]
        }
      });

      const savedCampaign = await newCampaign.save();
      console.log('Campaign saved:', savedCampaign._id);

      res.status(201).json({
        message: "Campaign created successfully",
        campaign: savedCampaign
      });
    } catch (error) {
      console.log('Error in createCampaign:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },



  // Get publisher's campaigns
  getPublisherCampaigns: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      let filter = { createdBy: userId };
      if (status) filter.status = status;

      const campaigns = await Campaign.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('createdBy', 'username email wallet');

      // Check wallet balance and update campaign display status
      const campaignsWithWalletStatus = campaigns.map(campaign => {
        const user = campaign.createdBy;
        const hasBalance = user.wallet.balance >= 0.50;
        
        return {
          ...campaign.toObject(),
          displayStatus: hasBalance ? campaign.status : 'inactive',
          walletBalance: user.wallet.balance,
          canRun: hasBalance
        };
      });

      const total = await Campaign.countDocuments(filter);

      res.status(200).json({
        message: "Campaigns fetched successfully",
        campaigns: campaignsWithWalletStatus,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      console.log('Error in getPublisherCampaigns:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Get single campaign
  getCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const campaign = await Campaign.findOne({ _id: id, createdBy: userId })
        .populate('createdBy', 'username email')
        .populate('reviewProcess.reviewedBy', 'username email');

      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.status(200).json({
        message: "Campaign fetched successfully",
        campaign
      });
    } catch (error) {
      console.log('Error in getCampaign:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Update campaign (only if draft or rejected)
  updateCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const campaign = await Campaign.findOne({ _id: id, createdBy: userId });
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (!['draft', 'rejected'].includes(campaign.status)) {
        return res.status(400).json({ 
          message: "Only draft or rejected campaigns can be updated" 
        });
      }

      const updateData = req.body;
      delete updateData.status; // Prevent status manipulation
      delete updateData.createdBy; // Prevent ownership change

      Object.assign(campaign, updateData);
      if (campaign.status === 'rejected') {
        campaign.status = 'draft'; // Reset to draft after update
      }

      await campaign.save();

      res.status(200).json({
        message: "Campaign updated successfully",
        campaign
      });
    } catch (error) {
      console.log('Error in updateCampaign:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Delete campaign (only if draft or by admin)
  deleteCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const campaign = await Campaign.findById(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Check ownership or admin privileges
      if (campaign.createdBy.toString() !== userId && userRole !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Only allow deletion of draft campaigns for regular users
      if (userRole !== 'admin' && campaign.status !== 'draft') {
        return res.status(400).json({ 
          message: "Only draft campaigns can be deleted" 
        });
      }

      await Campaign.findByIdAndDelete(id);

      res.status(200).json({
        message: "Campaign deleted successfully"
      });
    } catch (error) {
      console.log('Error in deleteCampaign:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Admin: Force delete any campaign
  adminDeleteCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      
      const campaign = await Campaign.findById(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      await Campaign.findByIdAndDelete(id);

      res.status(200).json({
        message: "Campaign deleted successfully by admin"
      });
    } catch (error) {
      console.log('Error in adminDeleteCampaign:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Get all campaigns (admin/viewer)
  getAllCampaigns: async (req, res) => {
    try {
      const { status, page = 1, limit = 50 } = req.query;
      
      let filter = { status: { $in: ['active', 'approved'] } };
      if (status && status !== 'all') {
        filter.status = status;
      }
      
      const campaigns = await Campaign.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('createdBy', 'username email wallet')
        .populate('reviewProcess.reviewedBy', 'username');

      // Check wallet balance for each campaign
      const campaignsWithWalletStatus = campaigns.map(campaign => {
        const user = campaign.createdBy;
        const hasBalance = user.wallet.balance >= 0.50;
        
        return {
          ...campaign.toObject(),
          displayStatus: hasBalance ? campaign.status : 'inactive',
          canRun: hasBalance
        };
      });

      const total = await Campaign.countDocuments(filter);

      res.status(200).json({
        message: "Campaigns fetched successfully",
        campaigns: campaignsWithWalletStatus,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      console.log('Error in getAllCampaigns:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Activate draft campaign
  activateCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const campaign = await Campaign.findOne({ _id: id, createdBy: userId });
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.status !== 'draft') {
        return res.status(400).json({ 
          message: "Only draft campaigns can be activated" 
        });
      }

      campaign.status = 'active';
      const now = new Date();
      if (!campaign.campaignDetails.schedule.startDate || campaign.campaignDetails.schedule.startDate < now) {
        campaign.campaignDetails.schedule.startDate = now;
      }

      await campaign.save();

      res.status(200).json({
        message: "Campaign activated successfully",
        campaign
      });
    } catch (error) {
      console.log('Error in activateCampaign:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Toggle campaign status (active/paused)
  toggleCampaignStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      let campaign;
      if (userRole === 'admin') {
        campaign = await Campaign.findById(id);
      } else {
        campaign = await Campaign.findOne({ _id: id, createdBy: userId });
      }

      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Toggle between active and paused
      if (campaign.status === 'active') {
        campaign.status = 'paused';
      } else if (campaign.status === 'paused' || campaign.status === 'approved') {
        campaign.status = 'active';
      } else {
        return res.status(400).json({ 
          message: "Campaign must be approved before activation" 
        });
      }

      await campaign.save();

      res.status(200).json({
        message: `Campaign ${campaign.status} successfully`,
        campaign
      });
    } catch (error) {
      console.log('Error in toggleCampaignStatus:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Get campaign analytics
  getCampaignAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const campaign = await Campaign.findOne({ _id: id, createdBy: userId });
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.status(200).json({
        message: "Campaign analytics fetched successfully",
        analytics: campaign.performance,
        campaign: {
          id: campaign._id,
          name: campaign.name,
          status: campaign.status,
          budget: campaign.campaignDetails.budget
        }
      });
    } catch (error) {
      console.log('Error in getCampaignAnalytics:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Submit campaign for review
  submitForReview: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const campaign = await Campaign.findOne({ _id: id, createdBy: userId });
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.status !== 'draft') {
        return res.status(400).json({ message: "Only draft campaigns can be submitted for review" });
      }

      campaign.status = 'pending_review';
      campaign.reviewProcess.submittedAt = new Date();
      campaign.reviewProcess.reviewHistory.push({
        action: 'submitted',
        date: new Date(),
        notes: 'Campaign submitted for admin review'
      });

      await campaign.save();

      res.status(200).json({
        message: "Campaign submitted for review successfully",
        campaign
      });
    } catch (error) {
      console.log('Error in submitForReview:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Admin: Get pending campaigns
  getPendingCampaigns: async (req, res) => {
    try {
      const campaigns = await Campaign.find({ status: 'pending_review' })
        .populate('createdBy', 'username email')
        .sort({ 'reviewProcess.submittedAt': -1 });

      res.status(200).json({
        message: "Pending campaigns fetched successfully",
        campaigns
      });
    } catch (error) {
      console.log('Error in getPendingCampaigns:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Admin: Approve campaign
  approveCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user.id;

      const campaign = await Campaign.findById(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.status !== 'pending_review') {
        return res.status(400).json({ message: "Only pending campaigns can be approved" });
      }

      campaign.status = 'approved';
      campaign.reviewProcess.reviewedAt = new Date();
      campaign.reviewProcess.reviewedBy = adminId;
      campaign.reviewProcess.reviewNotes = notes || 'Campaign approved';
      campaign.reviewProcess.reviewHistory.push({
        action: 'approved',
        date: new Date(),
        reviewerId: adminId,
        notes: notes || 'Campaign approved by admin'
      });

      await campaign.save();

      res.status(200).json({
        message: "Campaign approved successfully",
        campaign
      });
    } catch (error) {
      console.log('Error in approveCampaign:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Admin: Reject campaign
  rejectCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, notes } = req.body;
      const adminId = req.user.id;

      if (!reason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const campaign = await Campaign.findById(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.status !== 'pending_review') {
        return res.status(400).json({ message: "Only pending campaigns can be rejected" });
      }

      campaign.status = 'rejected';
      campaign.reviewProcess.reviewedAt = new Date();
      campaign.reviewProcess.reviewedBy = adminId;
      campaign.reviewProcess.rejectionReason = reason;
      campaign.reviewProcess.reviewNotes = notes || reason;
      campaign.reviewProcess.reviewHistory.push({
        action: 'rejected',
        date: new Date(),
        reviewerId: adminId,
        notes: `Rejected: ${reason}`
      });

      await campaign.save();

      res.status(200).json({
        message: "Campaign rejected successfully",
        campaign
      });
    } catch (error) {
      console.log('Error in rejectCampaign:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = CampaignController;