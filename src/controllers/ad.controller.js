const Ad = require('../models/Ad');
const Campaign = require('../models/Campaign');

// ============================================
// CREATE AD
// ============================================
const createAd = async (req, res) => {
  try {
    const publisherId = req.user._id;
    const {
      campaignId,
      name,
      adType,
      common,
      bannerAd,
      rewardedAd,
      interstitialAd,
      urlShortenerAd
    } = req.body;

    // Validation
    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Ad name must be at least 3 characters'
      });
    }

    if (!adType || !['banner', 'rewarded', 'interstitial', 'url_shortener'].includes(adType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ad type'
      });
    }

    // Check campaign exists and belongs to publisher
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

    // Validate ad type specific fields
    if (adType === 'banner' && (!bannerAd || !bannerAd.sizes || bannerAd.sizes.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Banner sizes required'
      });
    }

    if (adType === 'rewarded' && (!rewardedAd || !rewardedAd.videoUrl || !rewardedAd.reward)) {
      return res.status(400).json({
        success: false,
        message: 'Video URL and reward type required'
      });
    }

    if (adType === 'interstitial' && (!interstitialAd || !interstitialAd.creatives || interstitialAd.creatives.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Creatives required'
      });
    }

    if (adType === 'url_shortener' && (!urlShortenerAd || !urlShortenerAd.originalUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Original URL required'
      });
    }

    // Validate landing page URL
    if (!common || !common.landingPageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Landing page URL required'
      });
    }

    // Generate ad ID
    const count = await Ad.countDocuments({ adType });
    const typePrefix = adType.toUpperCase().replace('_', '-');
    const adId = `AD-${typePrefix}-${String(count + 1).padStart(6, '0')}`;

    const ad = new Ad({
      adId,
      name: name.trim(),
      campaignId,
      publisherId,
      adType,
      common,
      bannerAd: adType === 'banner' ? bannerAd : {},
      rewardedAd: adType === 'rewarded' ? rewardedAd : {},
      interstitialAd: adType === 'interstitial' ? interstitialAd : {},
      urlShortenerAd: adType === 'url_shortener' ? urlShortenerAd : {},
      status: 'draft'
    });

    await ad.save();

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      ad
    });

  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// ============================================
// UPDATE AD
// ============================================
const updateAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const publisherId = req.user._id;
    const updates = req.body;

    const ad = await Ad.findById(adId);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    if (ad.publisherId.toString() !== publisherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (ad.status !== 'draft' && ad.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${ad.status} ad`
      });
    }

    // Update only allowed fields
    const allowedFields = ['name', 'common', 'bannerAd', 'rewardedAd', 'interstitialAd', 'urlShortenerAd'];

    for (const field of allowedFields) {
      if (field in updates) {
        ad[field] = updates[field];
      }
    }

    await ad.save();

    res.json({
      success: true,
      message: 'Ad updated successfully',
      ad
    });

  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET ADS BY CAMPAIGN
// ============================================
const getAdsByCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const publisherId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Verify campaign ownership
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

    const ads = await Ad.find({ campaignId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ad.countDocuments({ campaignId });

    res.json({
      success: true,
      ads,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET AD DETAILS
// ============================================
const getAdDetails = async (req, res) => {
  try {
    const { adId } = req.params;

    const ad = await Ad.findById(adId)
      .populate('campaignId', 'campaignName budget')
      .populate('publisherId', 'username email');

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    res.json({
      success: true,
      ad
    });

  } catch (error) {
    console.error('Get ad details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// DELETE AD
// ============================================
const deleteAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const publisherId = req.user._id;

    const ad = await Ad.findById(adId);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    if (ad.publisherId.toString() !== publisherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (ad.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${ad.status} ad`
      });
    }

    await Ad.findByIdAndDelete(adId);

    res.json({
      success: true,
      message: 'Ad deleted successfully'
    });

  } catch (error) {
    console.error('Delete ad error:', error);
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
  createAd,
  updateAd,
  getAdsByCampaign,
  getAdDetails,
  deleteAd
};
