const ViewerAnalytics = require('../models/ViewerAnalytics');
const ViewerProfile = require('../models/ViewerProfile');

// ============================================
// TRACK VIEWER IMPRESSION
// ============================================
const trackImpression = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const { platformId, adType, revenue } = req.body;

    // Validation
    if (!platformId) {
      return res.status(400).json({
        success: false,
        message: 'Platform ID is required'
      });
    }

    if (!['banner', 'rewarded', 'interstitial', 'url_shortener'].includes(adType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ad type'
      });
    }

    if (revenue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Revenue cannot be negative'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await ViewerAnalytics.findOne({
      viewerId,
      platformId,
      date: today
    });

    if (!analytics) {
      analytics = new ViewerAnalytics({
        viewerId,
        platformId,
        date: today,
        metrics: {
          impressions: 1,
          clicks: 0,
          revenue: revenue || 0,
          byAdType: [{ adType, impressions: 1, clicks: 0, revenue: revenue || 0 }]
        }
      });
    } else {
      analytics.metrics.impressions += 1;
      analytics.metrics.revenue += revenue || 0;

      const byAdTypeIndex = analytics.metrics.byAdType.findIndex(b => b.adType === adType);
      if (byAdTypeIndex >= 0) {
        analytics.metrics.byAdType[byAdTypeIndex].impressions += 1;
        analytics.metrics.byAdType[byAdTypeIndex].revenue += revenue || 0;
      } else {
        analytics.metrics.byAdType.push({
          adType,
          impressions: 1,
          clicks: 0,
          revenue: revenue || 0
        });
      }
    }

    // Calculate metrics
    analytics.metrics.ecpm = analytics.metrics.impressions > 0
      ? (analytics.metrics.revenue / analytics.metrics.impressions) * 1000
      : 0;
    analytics.metrics.rpm = analytics.metrics.impressions > 0
      ? (analytics.metrics.revenue / analytics.metrics.impressions) * 1000
      : 0;

    await analytics.save();

    res.json({
      success: true,
      message: 'Impression tracked',
      analytics
    });

  } catch (error) {
    console.error('Track impression error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// TRACK VIEWER CLICK
// ============================================
const trackClick = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const { platformId, adType, revenue } = req.body;

    if (!platformId) {
      return res.status(400).json({
        success: false,
        message: 'Platform ID is required'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await ViewerAnalytics.findOne({
      viewerId,
      platformId,
      date: today
    });

    if (!analytics) {
      analytics = new ViewerAnalytics({
        viewerId,
        platformId,
        date: today,
        metrics: {
          impressions: 0,
          clicks: 1,
          revenue: revenue || 0,
          byAdType: [{ adType, impressions: 0, clicks: 1, revenue: revenue || 0 }]
        }
      });
    } else {
      analytics.metrics.clicks += 1;
      analytics.metrics.revenue += revenue || 0;

      const byAdTypeIndex = analytics.metrics.byAdType.findIndex(b => b.adType === adType);
      if (byAdTypeIndex >= 0) {
        analytics.metrics.byAdType[byAdTypeIndex].clicks += 1;
        analytics.metrics.byAdType[byAdTypeIndex].revenue += revenue || 0;
      } else {
        analytics.metrics.byAdType.push({
          adType,
          impressions: 0,
          clicks: 1,
          revenue: revenue || 0
        });
      }
    }

    // Recalculate metrics
    analytics.metrics.ecpm = analytics.metrics.impressions > 0
      ? (analytics.metrics.revenue / analytics.metrics.impressions) * 1000
      : 0;

    await analytics.save();

    res.json({
      success: true,
      message: 'Click tracked',
      analytics
    });

  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET VIEWER ANALYTICS
// ============================================
const getViewerAnalytics = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const { startDate, endDate, platformId, page = 1, limit = 10 } = req.query;

    const query = { viewerId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      query.date = { $gte: start, $lte: end };
    }

    if (platformId) {
      query.platformId = platformId;
    }

    const analytics = await ViewerAnalytics.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('topCampaigns.campaignId', 'campaignName');

    const total = await ViewerAnalytics.countDocuments(query);

    // Calculate aggregate metrics
    const aggregateMetrics = {
      totalImpressions: 0,
      totalClicks: 0,
      totalRevenue: 0,
      avgEcpm: 0
    };

    analytics.forEach(a => {
      aggregateMetrics.totalImpressions += a.metrics.impressions;
      aggregateMetrics.totalClicks += a.metrics.clicks;
      aggregateMetrics.totalRevenue += a.metrics.revenue;
    });

    aggregateMetrics.avgEcpm = aggregateMetrics.totalImpressions > 0
      ? (aggregateMetrics.totalRevenue / aggregateMetrics.totalImpressions) * 1000
      : 0;

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
    console.error('Get viewer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET VIEWER EARNINGS SUMMARY
// ============================================
const getEarningsSummary = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const { startDate, endDate } = req.query;

    const query = { viewerId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      query.date = { $gte: start, $lte: end };
    }

    const analytics = await ViewerAnalytics.find(query);

    const summary = {
      totalRevenue: 0,
      totalImpressions: 0,
      totalClicks: 0,
      averageEcpm: 0,
      topAdTypes: {}
    };

    analytics.forEach(a => {
      summary.totalRevenue += a.metrics.revenue;
      summary.totalImpressions += a.metrics.impressions;
      summary.totalClicks += a.metrics.clicks;

      a.metrics.byAdType.forEach(byType => {
        if (!summary.topAdTypes[byType.adType]) {
          summary.topAdTypes[byType.adType] = { revenue: 0, impressions: 0 };
        }
        summary.topAdTypes[byType.adType].revenue += byType.revenue;
        summary.topAdTypes[byType.adType].impressions += byType.impressions;
      });
    });

    summary.averageEcpm = summary.totalImpressions > 0
      ? (summary.totalRevenue / summary.totalImpressions) * 1000
      : 0;

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Get earnings summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET TOP CAMPAIGNS FOR VIEWER
// ============================================
const getTopCampaigns = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const { platformId, limit = 10 } = req.query;

    const query = { viewerId };
    if (platformId) query.platformId = platformId;

    const topCampaigns = await ViewerAnalytics.aggregate([
      { $match: query },
      { $unwind: '$topCampaigns' },
      { $group: {
          _id: '$topCampaigns.campaignId',
          totalImpressions: { $sum: '$topCampaigns.impressions' },
          totalRevenue: { $sum: '$topCampaigns.revenue' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      { $lookup: {
          from: 'campaigns',
          localField: '_id',
          foreignField: '_id',
          as: 'campaign'
        }
      }
    ]);

    res.json({
      success: true,
      topCampaigns
    });

  } catch (error) {
    console.error('Get top campaigns error:', error);
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
  trackImpression,
  trackClick,
  getViewerAnalytics,
  getEarningsSummary,
  getTopCampaigns
};
