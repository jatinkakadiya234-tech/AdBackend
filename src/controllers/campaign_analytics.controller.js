const CampaignAnalytics = require('../models/CampaignAnalytics');

// ============================================
// TRACK CAMPAIGN METRICS
// ============================================
const trackCampaignMetrics = async (req, res) => {
  try {
    const { campaignId, publisherId, impressions = 0, clicks = 0, conversions = 0, spend = 0, platform, device, country, countryCode } = req.body;

    if (!campaignId || !publisherId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID and Publisher ID are required'
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

    let analytics = await CampaignAnalytics.findOne({
      campaignId,
      date: today
    });

    if (!analytics) {
      analytics = new CampaignAnalytics({
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

    // Update platform breakdown
    if (platform) {
      const platformIndex = analytics.byPlatform.findIndex(p => p.platform === platform);
      if (platformIndex >= 0) {
        analytics.byPlatform[platformIndex].impressions += impressions;
        analytics.byPlatform[platformIndex].clicks += clicks;
        analytics.byPlatform[platformIndex].conversions += conversions;
        analytics.byPlatform[platformIndex].spend += spend;
      } else {
        analytics.byPlatform.push({ platform, impressions, clicks, conversions, spend });
      }
    }

    // Update device breakdown
    if (device) {
      const deviceIndex = analytics.byDevice.findIndex(d => d.deviceType === device);
      if (deviceIndex >= 0) {
        analytics.byDevice[deviceIndex].impressions += impressions;
        analytics.byDevice[deviceIndex].clicks += clicks;
        analytics.byDevice[deviceIndex].conversions += conversions;
        analytics.byDevice[deviceIndex].spend += spend;
      } else {
        analytics.byDevice.push({ deviceType: device, impressions, clicks, conversions, spend });
      }
    }

    // Update country breakdown
    if (country) {
      const countryIndex = analytics.byCountry.findIndex(c => c.country === country);
      if (countryIndex >= 0) {
        analytics.byCountry[countryIndex].impressions += impressions;
        analytics.byCountry[countryIndex].clicks += clicks;
        analytics.byCountry[countryIndex].conversions += conversions;
        analytics.byCountry[countryIndex].spend += spend;
      } else {
        analytics.byCountry.push({ country, countryCode, impressions, clicks, conversions, spend });
      }
    }

    await analytics.save();

    res.json({
      success: true,
      message: 'Campaign metrics tracked',
      analytics
    });

  } catch (error) {
    console.error('Track campaign metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET CAMPAIGN ANALYTICS
// ============================================
const getCampaignAnalytics = async (req, res) => {
  try {
    const { campaignId, startDate, endDate, page = 1, limit = 10 } = req.query;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required'
      });
    }

    const query = { campaignId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      query.date = { $gte: start, $lte: end };
    }

    const analytics = await CampaignAnalytics.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CampaignAnalytics.countDocuments(query);

    // Aggregate metrics
    const aggregateMetrics = {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      avgCtr: 0,
      avgCpc: 0,
      avgCpm: 0,
      avgCpa: 0
    };

    analytics.forEach(a => {
      aggregateMetrics.totalImpressions += a.metrics.impressions;
      aggregateMetrics.totalClicks += a.metrics.clicks;
      aggregateMetrics.totalConversions += a.metrics.conversions;
      aggregateMetrics.totalSpend += a.metrics.spend;
      aggregateMetrics.avgCtr += a.metrics.ctr;
      aggregateMetrics.avgCpc += a.metrics.cpc;
      aggregateMetrics.avgCpm += a.metrics.cpm;
      aggregateMetrics.avgCpa += a.metrics.cpa;
    });

    if (analytics.length > 0) {
      aggregateMetrics.avgCtr /= analytics.length;
      aggregateMetrics.avgCpc /= analytics.length;
      aggregateMetrics.avgCpm /= analytics.length;
      aggregateMetrics.avgCpa /= analytics.length;
    }

    res.json({
      success: true,
      analytics,
      aggregateMetrics,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get campaign analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET CAMPAIGN PERFORMANCE BY PLATFORM
// ============================================
const getCampaignByPlatform = async (req, res) => {
  try {
    const { campaignId } = req.query;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required'
      });
    }

    const analytics = await CampaignAnalytics.find({ campaignId });

    const platformPerformance = {};

    analytics.forEach(a => {
      a.byPlatform.forEach(p => {
        if (!platformPerformance[p.platform]) {
          platformPerformance[p.platform] = {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            spend: 0
          };
        }
        platformPerformance[p.platform].impressions += p.impressions;
        platformPerformance[p.platform].clicks += p.clicks;
        platformPerformance[p.platform].conversions += p.conversions;
        platformPerformance[p.platform].spend += p.spend;
      });
    });

    res.json({
      success: true,
      platformPerformance
    });

  } catch (error) {
    console.error('Get platform performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET CAMPAIGN PERFORMANCE BY DEVICE
// ============================================
const getCampaignByDevice = async (req, res) => {
  try {
    const { campaignId } = req.query;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required'
      });
    }

    const analytics = await CampaignAnalytics.find({ campaignId });

    const devicePerformance = {};

    analytics.forEach(a => {
      a.byDevice.forEach(d => {
        if (!devicePerformance[d.deviceType]) {
          devicePerformance[d.deviceType] = {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            spend: 0
          };
        }
        devicePerformance[d.deviceType].impressions += d.impressions;
        devicePerformance[d.deviceType].clicks += d.clicks;
        devicePerformance[d.deviceType].conversions += d.conversions;
        devicePerformance[d.deviceType].spend += d.spend;
      });
    });

    res.json({
      success: true,
      devicePerformance
    });

  } catch (error) {
    console.error('Get device performance error:', error);
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
  trackCampaignMetrics,
  getCampaignAnalytics,
  getCampaignByPlatform,
  getCampaignByDevice
};
