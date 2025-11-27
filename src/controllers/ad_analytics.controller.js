const AdAnalytics = require('../models/AdAnalytics');

// ============================================
// TRACK AD METRICS
// ============================================
const trackAdMetrics = async (req, res) => {
  try {
    const { adId, campaignId, publisherId, impressions = 0, clicks = 0, conversions = 0, spend = 0, platform, device, country } = req.body;

    if (!adId || !campaignId || !publisherId) {
      return res.status(400).json({
        success: false,
        message: 'Ad ID, Campaign ID, and Publisher ID are required'
      });
    }

    if (impressions < 0 || clicks < 0 || conversions < 0 || spend < 0) {
      return res.status(400).json({
        success: false,
        message: 'Metrics cannot be negative'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await AdAnalytics.findOne({
      adId,
      date: today
    });

    if (!analytics) {
      analytics = new AdAnalytics({
        adId,
        campaignId,
        publisherId,
        date: today,
        metrics: {
          impressions,
          clicks,
          conversions,
          spend
        }
      });
    } else {
      analytics.metrics.impressions += impressions;
      analytics.metrics.clicks += clicks;
      analytics.metrics.conversions += conversions;
      analytics.metrics.spend += spend;
    }

    // Calculate metrics
    if (analytics.metrics.impressions > 0) {
      analytics.metrics.ctr = (analytics.metrics.clicks / analytics.metrics.impressions) * 100;
      analytics.metrics.cpm = (analytics.metrics.spend / analytics.metrics.impressions) * 1000;
    }

    if (analytics.metrics.clicks > 0) {
      analytics.metrics.cpc = analytics.metrics.spend / analytics.metrics.clicks;
      analytics.metrics.conversionRate = (analytics.metrics.conversions / analytics.metrics.clicks) * 100;
    }

    if (analytics.metrics.conversions > 0) {
      analytics.metrics.cpa = analytics.metrics.spend / analytics.metrics.conversions;
    }

    // Update breakdown
    if (platform) {
      const platformIndex = analytics.byPlatform.findIndex(p => p.platform === platform);
      if (platformIndex >= 0) {
        analytics.byPlatform[platformIndex].impressions += impressions;
        analytics.byPlatform[platformIndex].clicks += clicks;
      } else {
        analytics.byPlatform.push({ platform, impressions, clicks });
      }
    }

    if (device) {
      const deviceIndex = analytics.byDevice.findIndex(d => d.deviceType === device);
      if (deviceIndex >= 0) {
        analytics.byDevice[deviceIndex].impressions += impressions;
        analytics.byDevice[deviceIndex].clicks += clicks;
      } else {
        analytics.byDevice.push({ deviceType: device, impressions, clicks });
      }
    }

    if (country) {
      const countryIndex = analytics.byCountry.findIndex(c => c.country === country);
      if (countryIndex >= 0) {
        analytics.byCountry[countryIndex].impressions += impressions;
        analytics.byCountry[countryIndex].clicks += clicks;
      } else {
        analytics.byCountry.push({ country, impressions, clicks });
      }
    }

    await analytics.save();

    res.json({
      success: true,
      message: 'Ad metrics tracked',
      analytics
    });

  } catch (error) {
    console.error('Track ad metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET AD ANALYTICS
// ============================================
const getAdAnalytics = async (req, res) => {
  try {
    const { adId, campaignId, startDate, endDate, page = 1, limit = 10 } = req.query;

    if (!adId && !campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Ad ID or Campaign ID is required'
      });
    }

    const query = {};
    if (adId) query.adId = adId;
    if (campaignId) query.campaignId = campaignId;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      query.date = { $gte: start, $lte: end };
    }

    const analytics = await AdAnalytics.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('campaignId', 'campaignName');

    const total = await AdAnalytics.countDocuments(query);

    res.json({
      success: true,
      analytics,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get ad analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET AD PERFORMANCE SUMMARY
// ============================================
const getAdPerformanceSummary = async (req, res) => {
  try {
    const { adId } = req.query;

    if (!adId) {
      return res.status(400).json({
        success: false,
        message: 'Ad ID is required'
      });
    }

    const analytics = await AdAnalytics.find({ adId });

    const summary = {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      avgCtr: 0,
      avgCpc: 0,
      avgCpm: 0,
      avgCpa: 0,
      topCountries: []
    };

    analytics.forEach(a => {
      summary.totalImpressions += a.metrics.impressions;
      summary.totalClicks += a.metrics.clicks;
      summary.totalConversions += a.metrics.conversions;
      summary.totalSpend += a.metrics.spend;
      summary.avgCtr += a.metrics.ctr;
      summary.avgCpc += a.metrics.cpc;
      summary.avgCpm += a.metrics.cpm;
      summary.avgCpa += a.metrics.cpa;
    });

    if (analytics.length > 0) {
      summary.avgCtr /= analytics.length;
      summary.avgCpc /= analytics.length;
      summary.avgCpm /= analytics.length;
      summary.avgCpa /= analytics.length;
    }

    // Get top countries
    const countryMap = {};
    analytics.forEach(a => {
      a.byCountry.forEach(c => {
        if (!countryMap[c.country]) {
          countryMap[c.country] = { impressions: 0, clicks: 0 };
        }
        countryMap[c.country].impressions += c.impressions;
        countryMap[c.country].clicks += c.clicks;
      });
    });

    summary.topCountries = Object.entries(countryMap)
      .map(([country, data]) => ({ country, ...data }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5);

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Get ad performance error:', error);
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
  trackAdMetrics,
  getAdAnalytics,
  getAdPerformanceSummary
};
