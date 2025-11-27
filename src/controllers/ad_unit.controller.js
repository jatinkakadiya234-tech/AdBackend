const AdUnit = require('../models/AdUnit');
const crypto = require('crypto');

// ============================================
// CREATE AD UNIT
// ============================================
const createAdUnit = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const {
      name,
      description,
      platformId,
      type,
      banner,
      video,
      interstitial,
      native,
      targeting,
      siteInfo
    } = req.body;

    // Validation
    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Ad unit name must be at least 3 characters'
      });
    }

    if (!platformId) {
      return res.status(400).json({
        success: false,
        message: 'Platform ID required'
      });
    }

    if (!type || !['banner', 'rewarded', 'interstitial', 'native', 'video'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ad unit type'
      });
    }

    // Generate unique code and ad unit ID
    const code = crypto.randomBytes(16).toString('hex');
    const count = await AdUnit.countDocuments();
    const adUnitId = `UNIT-${Date.now()}-${String(count + 1).padStart(4, '0')}`;

    const adUnit = new AdUnit({
      adUnitId,
      name: name.trim(),
      description,
      viewerId,
      platformId,
      type,
      code,
      banner: type === 'banner' ? banner : {},
      video: type === 'video' ? video : {},
      interstitial: type === 'interstitial' ? interstitial : {},
      native: type === 'native' ? native : {},
      targeting,
      siteInfo,
      status: 'active',
      verification: {
        verified: false,
        verificationCode: crypto.randomBytes(8).toString('hex')
      }
    });

    await adUnit.save();

    res.status(201).json({
      success: true,
      message: 'Ad unit created successfully',
      adUnit,
      integrationCode: code
    });

  } catch (error) {
    console.error('Create ad unit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET AD UNITS
// ============================================
const getAdUnits = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { viewerId };
    if (status) query.status = status;

    const adUnits = await AdUnit.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdUnit.countDocuments(query);

    res.json({
      success: true,
      adUnits,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get ad units error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// UPDATE AD UNIT
// ============================================
const updateAdUnit = async (req, res) => {
  try {
    const { adUnitId } = req.params;
    const viewerId = req.user._id;
    const updates = req.body;

    const adUnit = await AdUnit.findById(adUnitId);

    if (!adUnit) {
      return res.status(404).json({
        success: false,
        message: 'Ad unit not found'
      });
    }

    if (adUnit.viewerId.toString() !== viewerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Update allowed fields
    const allowedFields = ['name', 'description', 'targeting', 'siteInfo', 'status', 'banner', 'interstitial', 'native', 'video'];

    for (const field of allowedFields) {
      if (field in updates) {
        adUnit[field] = updates[field];
      }
    }

    await adUnit.save();

    res.json({
      success: true,
      message: 'Ad unit updated successfully',
      adUnit
    });

  } catch (error) {
    console.error('Update ad unit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// VERIFY AD UNIT
// ============================================
const verifyAdUnit = async (req, res) => {
  try {
    const { adUnitId } = req.params;
    const { verificationCode } = req.body;
    const viewerId = req.user._id;

    const adUnit = await AdUnit.findById(adUnitId);

    if (!adUnit) {
      return res.status(404).json({
        success: false,
        message: 'Ad unit not found'
      });
    }

    if (adUnit.viewerId.toString() !== viewerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (adUnit.verification.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    adUnit.verification.verified = true;
    adUnit.verification.verifiedAt = new Date();
    adUnit.integration.isIntegrated = true;
    adUnit.integration.integratedAt = new Date();

    await adUnit.save();

    res.json({
      success: true,
      message: 'Ad unit verified successfully',
      adUnit
    });

  } catch (error) {
    console.error('Verify ad unit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET AD UNIT STATS
// ============================================
const getAdUnitStats = async (req, res) => {
  try {
    const { adUnitId } = req.params;
    const viewerId = req.user._id;

    const adUnit = await AdUnit.findById(adUnitId).select('stats integration');

    if (!adUnit) {
      return res.status(404).json({
        success: false,
        message: 'Ad unit not found'
      });
    }

    if (adUnit.viewerId.toString() !== viewerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    res.json({
      success: true,
      stats: adUnit.stats,
      lastActivity: adUnit.integration.lastActivityAt
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// DELETE AD UNIT
// ============================================
const deleteAdUnit = async (req, res) => {
  try {
    const { adUnitId } = req.params;
    const viewerId = req.user._id;

    const adUnit = await AdUnit.findById(adUnitId);

    if (!adUnit) {
      return res.status(404).json({
        success: false,
        message: 'Ad unit not found'
      });
    }

    if (adUnit.viewerId.toString() !== viewerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (adUnit.stats.totalImpressions > 0 || adUnit.stats.totalClicks > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete ad unit with active impressions or clicks'
      });
    }

    await AdUnit.findByIdAndDelete(adUnitId);

    res.json({
      success: true,
      message: 'Ad unit deleted successfully'
    });

  } catch (error) {
    console.error('Delete ad unit error:', error);
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
  createAdUnit,
  getAdUnits,
  updateAdUnit,
  verifyAdUnit,
  getAdUnitStats,
  deleteAdUnit
};
