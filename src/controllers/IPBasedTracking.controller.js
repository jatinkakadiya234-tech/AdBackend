const IPTracking = require('../models/IPTracking');
const crypto = require('crypto');

// ============================================
// RECORD IP CLICK
// ============================================
const recordClick = async (req, res) => {
  try {
    const { ipAddress, adId, adUnitId, campaignId, publisherId, viewerId, deviceType, platform, sdk, sdkVersion, country, countryCode, timezone } = req.body;

    if (!ipAddress || !adId) {
      return res.status(400).json({
        success: false,
        message: 'IP Address and Ad ID are required'
      });
    }

    // Create IP hash (SHA256)
    const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');

    // Validate click limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let ipTracking = await IPTracking.findOne({ ipHash });

    if (!ipTracking) {
      ipTracking = new IPTracking({
        ipAddress,
        ipHash,
        location: { country, countryCode, timezone },
        adClicks: [{
          adId,
          adUnit: adUnitId,
          campaignId,
          publisherId,
          viewerId,
          clicks: [{
            timestamp: new Date(),
            userAgent: req.headers['user-agent'],
            deviceType,
            platform,
            sdk,
            sdkVersion
          }],
          dailyClicks: [{ date: today, count: 1 }],
          totalClicks: 1,
          firstClickAt: new Date(),
          lastClickAt: new Date()
        }]
      });
    } else {
      // Find ad in adClicks array
      let adClick = ipTracking.adClicks.find(ac => ac.adId.toString() === adId);

      if (!adClick) {
        // New ad
        adClick = {
          adId,
          adUnit: adUnitId,
          campaignId,
          publisherId,
          viewerId,
          clicks: [],
          dailyClicks: [],
          totalClicks: 0
        };
        ipTracking.adClicks.push(adClick);
      }

      // Check daily limit (10 clicks per day per ad)
      let dailyClick = adClick.dailyClicks.find(dc =>
        new Date(dc.date).setHours(0, 0, 0, 0) === today.getTime()
      );

      if (dailyClick && dailyClick.count >= 10) {
        return res.status(429).json({
          success: false,
          message: 'Daily click limit exceeded for this ad'
        });
      }

      // Record click
      adClick.clicks.push({
        timestamp: new Date(),
        userAgent: req.headers['user-agent'],
        deviceType,
        platform,
        sdk,
        sdkVersion
      });

      // Update daily clicks
      if (dailyClick) {
        dailyClick.count += 1;
      } else {
        adClick.dailyClicks.push({ date: today, count: 1 });
      }

      adClick.totalClicks += 1;
      adClick.lastClickAt = new Date();
      if (!adClick.firstClickAt) {
        adClick.firstClickAt = new Date();
      }
    }

    await ipTracking.save();

    res.json({
      success: true,
      message: 'Click recorded',
      ipTracking
    });

  } catch (error) {
    console.error('Record click error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET IP TRACKING DATA
// ============================================
const getIPTrackingData = async (req, res) => {
  try {
    const { ipHash } = req.query;

    if (!ipHash) {
      return res.status(400).json({
        success: false,
        message: 'IP Hash is required'
      });
    }

    const ipTracking = await IPTracking.findOne({ ipHash })
      .populate('adClicks.adId', 'name')
      .populate('adClicks.campaignId', 'campaignName')
      .populate('adClicks.publisherId', 'username')
      .populate('adClicks.viewerId', 'username');

    if (!ipTracking) {
      return res.status(404).json({
        success: false,
        message: 'IP tracking data not found'
      });
    }

    res.json({
      success: true,
      ipTracking
    });

  } catch (error) {
    console.error('Get IP tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET IP CLICK HISTORY
// ============================================
const getClickHistory = async (req, res) => {
  try {
    const { ipHash, adId, days = 7 } = req.query;

    if (!ipHash) {
      return res.status(400).json({
        success: false,
        message: 'IP Hash is required'
      });
    }

    const ipTracking = await IPTracking.findOne({ ipHash });

    if (!ipTracking) {
      return res.status(404).json({
        success: false,
        message: 'IP tracking data not found'
      });
    }

    let adClick = null;
    if (adId) {
      adClick = ipTracking.adClicks.find(ac => ac.adId.toString() === adId);
    }

    if (adId && !adClick) {
      return res.status(404).json({
        success: false,
        message: 'No click history for this ad'
      });
    }

    // Get recent clicks
    const history = adClick
      ? adClick.clicks
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 100)
      : [];

    res.json({
      success: true,
      totalClicks: adClick ? adClick.totalClicks : 0,
      history
    });

  } catch (error) {
    console.error('Get click history error:', error);
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
  recordClick,
  getIPTrackingData,
  getClickHistory
};
