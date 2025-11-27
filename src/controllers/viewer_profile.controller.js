const ViewerProfile = require('../models/ViewerProfile');
const crypto = require('crypto');

// ============================================
// CREATE OR GET VIEWER PROFILE
// ============================================
const createOrGetProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await ViewerProfile.findOne({ userId });

    if (profile) {
      return res.json({
        success: true,
        message: 'Profile retrieved',
        profile
      });
    }

    profile = new ViewerProfile({
      userId,
      platformStatus: 'not_submitted'
    });

    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Profile created',
      profile
    });

  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// ADD PLATFORM TO PROFILE
// ============================================
const addPlatform = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, type, url, packageName, category, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Platform name and type are required'
      });
    }

    if (!['website', 'ios_app', 'android_app', 'flutter_app', 'react_native_app'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform type'
      });
    }

    let profile = await ViewerProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Viewer profile not found'
      });
    }

    // Generate unique platform ID
    const platformId = `PLT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const platform = {
      platformId,
      name: name.trim(),
      type,
      url,
      packageName,
      category,
      description,
      verificationStatus: 'not_verified',
      verificationCode: crypto.randomBytes(8).toString('hex'),
      isActive: true
    };

    profile.platforms.push(platform);
    profile.stats.totalPlatforms = profile.platforms.length;

    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Platform added',
      platform
    });

  } catch (error) {
    console.error('Add platform error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// VERIFY PLATFORM
// ============================================
const verifyPlatform = async (req, res) => {
  try {
    const userId = req.user._id;
    const { platformId, verificationCode } = req.body;

    if (!platformId || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Platform ID and verification code are required'
      });
    }

    let profile = await ViewerProfile.findOne({
      userId,
      'platforms.platformId': platformId
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }

    const platform = profile.platforms.find(p => p.platformId === platformId);

    if (platform.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    platform.verificationStatus = 'verified';
    platform.verifiedAt = new Date();
    profile.stats.verifiedPlatforms += 1;

    await profile.save();

    res.json({
      success: true,
      message: 'Platform verified',
      platform
    });

  } catch (error) {
    console.error('Verify platform error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// UPDATE PAYMENT SETTINGS
// ============================================
const updatePaymentSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { payoutMethod, minimumPayout, payoutFrequency, bankDetails, paypalEmail } = req.body;

    if (!payoutMethod || !['bank_transfer', 'paypal', 'stripe', 'wire_transfer'].includes(payoutMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout method'
      });
    }

    let profile = await ViewerProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Viewer profile not found'
      });
    }

    profile.paymentSettings.payoutMethod = payoutMethod;
    if (minimumPayout) profile.paymentSettings.minimumPayout = minimumPayout;
    if (payoutFrequency) profile.paymentSettings.payoutFrequency = payoutFrequency;

    if (payoutMethod === 'bank_transfer' && bankDetails) {
      if (!bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName) {
        return res.status(400).json({
          success: false,
          message: 'Bank details are incomplete'
        });
      }
      profile.paymentSettings.bankDetails = bankDetails;
    }

    if (payoutMethod === 'paypal' && paypalEmail) {
      profile.paymentSettings.paypalEmail = paypalEmail;
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Payment settings updated',
      paymentSettings: profile.paymentSettings
    });

  } catch (error) {
    console.error('Update payment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// UPDATE TAX INFORMATION
// ============================================
const updateTaxInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taxId, country, w9Submitted, w9FileUrl } = req.body;

    let profile = await ViewerProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Viewer profile not found'
      });
    }

    profile.taxInfo = {
      taxId,
      country,
      w9Submitted: w9Submitted || false,
      w9FileUrl
    };

    await profile.save();

    res.json({
      success: true,
      message: 'Tax information updated',
      taxInfo: profile.taxInfo
    });

  } catch (error) {
    console.error('Update tax info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET VIEWER PROFILE
// ============================================
const getViewerProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const profile = await ViewerProfile.findOne({ userId })
      .populate('accountManager', 'username email');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Viewer profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET PLATFORM STATISTICS
// ============================================
const getPlatformStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { platformId } = req.query;

    if (!platformId) {
      return res.status(400).json({
        success: false,
        message: 'Platform ID is required'
      });
    }

    const profile = await ViewerProfile.findOne({
      userId,
      'platforms.platformId': platformId
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found'
      });
    }

    const platform = profile.platforms.find(p => p.platformId === platformId);

    res.json({
      success: true,
      stats: platform.stats,
      verificationStatus: platform.verificationStatus
    });

  } catch (error) {
    console.error('Get platform stats error:', error);
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
  createOrGetProfile,
  addPlatform,
  verifyPlatform,
  updatePaymentSettings,
  updateTaxInfo,
  getViewerProfile,
  getPlatformStats
};
