const Campaign = require('../models/Campaign');
const Ad = require('../models/Ad');
const User = require('../models/User');

// ============================================
// CREATE CAMPAIGN
// ============================================
const createCampaign = async (req, res) => {
  try {
    const publisherId = req.user._id;
    const {
      campaignName,
      objective,
      campaignDuration,
      schedule,
      adType,
      budget,
      dailyBudget,
      targeting
    } = req.body;

    // Validation
    if (!campaignName || campaignName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Campaign name must be at least 3 characters'
      });
    }

    if (!adType || !['banner', 'rewarded', 'interstitial', 'url_shortener'].includes(adType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ad type'
      });
    }

    if (!budget || budget.total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be greater than 0'
      });
    }

    if (campaignDuration === 'scheduled') {
      if (!schedule || !schedule.startDate || !schedule.endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start and end dates required for scheduled campaigns'
        });
      }

      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);

      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    // Check publisher's KYC status
    const user = await User.findById(publisherId).populate('publisherProfile');
    if (!user || !user.publisherProfile) {
      return res.status(403).json({
        success: false,
        message: 'Publisher profile not found'
      });
    }

    if (user.publisherProfile.kycStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'KYC verification required to create campaigns'
      });
    }

    // Generate campaign ID
    const count = await Campaign.countDocuments({ publisherId });
    const campaignId = `CAMP-${Date.now()}-${String(count + 1).padStart(4, '0')}`;

    const campaign = new Campaign({
      campaignId,
      publisherId,
      campaignName: campaignName.trim(),
      objective,
      campaignDuration,
      schedule: campaignDuration === 'scheduled' ? schedule : {},
      adType,
      budget,
      dailyBudget,
      targeting,
      status: 'draft',
      reviewStatus: 'not_submitted'
    });

    await campaign.save();

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// UPDATE CAMPAIGN
// ============================================
const updateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const publisherId = req.user._id;
    const { campaignName, objective, budget, dailyBudget, targeting } = req.body;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.publisherId.toString() !== publisherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Don't allow updates to active campaigns
    if (['active', 'paused', 'completed', 'rejected'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${campaign.status} campaign`
      });
    }

    // Update fields
    if (campaignName) campaign.campaignName = campaignName.trim();
    if (objective) campaign.objective = objective;
    if (budget) campaign.budget = budget;
    if (dailyBudget) campaign.dailyBudget = dailyBudget;
    if (targeting) campaign.targeting = targeting;

    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign
    });

  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET CAMPAIGNS
// ============================================
const getCampaigns = async (req, res) => {
  try {
    const publisherId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { publisherId };
    if (status) query.status = status;

    const campaigns = await Campaign.find(query)
      .populate('publisherId', 'username email')
      .populate('adminReview.reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Campaign.countDocuments(query);

    res.json({
      success: true,
      campaigns,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// PAUSE CAMPAIGN
// ============================================
const pauseCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const publisherId = req.user._id;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.publisherId.toString() !== publisherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active campaigns can be paused'
      });
    }

    campaign.status = 'paused';
    await campaign.save();

    // Update all ads in campaign
    await Ad.updateMany(
      { campaignId },
      { status: 'paused' }
    );

    res.json({
      success: true,
      message: 'Campaign paused successfully',
      campaign
    });

  } catch (error) {
    console.error('Pause campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// RESUME CAMPAIGN
// ============================================
const resumeCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const publisherId = req.user._id;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.publisherId.toString() !== publisherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (campaign.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Only paused campaigns can be resumed'
      });
    }

    campaign.status = 'active';
    await campaign.save();

    // Update all ads in campaign
    await Ad.updateMany(
      { campaignId },
      { status: 'active' }
    );

    res.json({
      success: true,
      message: 'Campaign resumed successfully',
      campaign
    });

  } catch (error) {
    console.error('Resume campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// SUBMIT FOR REVIEW
// ============================================
const submitForReview = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const publisherId = req.user._id;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.publisherId.toString() !== publisherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft campaigns can be submitted'
      });
    }

    // Validate campaign has at least one ad
    const adCount = await Ad.countDocuments({ campaignId });
    if (adCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Campaign must have at least one ad'
      });
    }

    campaign.status = 'pending_review';
    campaign.reviewStatus = 'pending_review';
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign submitted for review',
      campaign
    });

  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  createCampaign,
  updateCampaign,
  getCampaigns,
  pauseCampaign,
  resumeCampaign,
  submitForReview
};
