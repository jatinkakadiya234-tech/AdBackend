const AdUnitAnalytics = require('../models/AdUnitAnalytics');

// ============================================
// TRACK AD UNIT METRICS
// ============================================
const trackAdUnitMetrics = async (req, res) => {
  try {
    const { adUnitId, viewerId, platformId, impressions = 0, clicks = 0, conversions = 0, revenue = 0, adType } = req.body;

    if (!adUnitId || !viewerId || !platformId) {
      return res.status(400).json({
        success: false,
        message: 'Ad Unit ID, Viewer ID, and Platform ID are required'
      });
    }

    if (impressions < 0 || clicks < 0 || conversions < 0 || revenue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Metrics cannot be negative'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await AdUnitAnalytics.findOne({
      adUnitId,
      date: today
    });

    if (!analytics) {
      analytics = new AdUnitAnalytics({
        adUnitId,
        viewerId,
        platformId,
        date: today,
        metrics: {
          impressions,
          clicks,
          conversions,
          revenue
        }
      });

      if (adType) {
        analytics.metrics.byAdType = [{ adType, impressions, clicks, conversions, revenue }];
      }
    } else {
      analytics.metrics.impressions += impressions;
      analytics.metrics.clicks += clicks;
      analytics.metrics.conversions += conversions;
      analytics.metrics.revenue += revenue;

      if (adType) {
        const adTypeIndex = analytics.metrics.byAdType.findIndex(b => b.adType === adType);
        if (adTypeIndex >= 0) {
          analytics.metrics.byAdType[adTypeIndex].impressions += impressions;
          analytics.metrics.byAdType[adTypeIndex].clicks += clicks;
          analytics.metrics.byAdType[adTypeIndex].conversions += conversions;
          analytics.metrics.byAdType[adTypeIndex].revenue += revenue;
        } else {
          analytics.metrics.byAdType.push({ adType, impressions, clicks, conversions, revenue });
        }
      }
    }

    // Calculate metrics
    if (analytics.metrics.impressions > 0) {
      analytics.metrics.ctr = (analytics.metrics.clicks / analytics.metrics.impressions) * 100;
      analytics.metrics.ecpm = (analytics.metrics.revenue / analytics.metrics.impressions) * 1000;
      analytics.metrics.rpm = (analytics.metrics.revenue / analytics.metrics.impressions) * 1000;
    }

    await analytics.save();

    res.json({
      success: true,
      message: 'Ad unit metrics tracked',
      analytics
    });

  } catch (error) {
    console.error('Track ad unit metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET AD UNIT ANALYTICS
// ============================================
const getAdUnitAnalytics = async (req, res) => {
  try {
    const { adUnitId, startDate, endDate, page = 1, limit = 10 } = req.query;

    if (!adUnitId) {
      return res.status(400).json({
        success: false,
        message: 'Ad Unit ID is required'
      });
    }

    const query = { adUnitId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      query.date = { $gte: start, $lte: end };
    }

    const analytics = await AdUnitAnalytics.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('topCampaigns.campaignId', 'campaignName');

    const total = await AdUnitAnalytics.countDocuments(query);

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
    console.error('Get ad unit analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET AD UNIT REVENUE SUMMARY
// ============================================
const getRevenueSummary = async (req, res) => {
  try {
    const { adUnitId } = req.query;

    if (!adUnitId) {
      return res.status(400).json({
        success: false,
        message: 'Ad Unit ID is required'
      });
    }

    const analytics = await AdUnitAnalytics.find({ adUnitId });

    const summary = {
      totalRevenue: 0,
      totalImpressions: 0,
      totalClicks: 0,
      avgEcpm: 0,
      revenueByAdType: {}
    };

    analytics.forEach(a => {
      summary.totalRevenue += a.metrics.revenue;
      summary.totalImpressions += a.metrics.impressions;
      summary.totalClicks += a.metrics.clicks;

      a.metrics.byAdType.forEach(byType => {
        if (!summary.revenueByAdType[byType.adType]) {
          summary.revenueByAdType[byType.adType] = { revenue: 0, impressions: 0 };
        }
        summary.revenueByAdType[byType.adType].revenue += byType.revenue;
        summary.revenueByAdType[byType.adType].impressions += byType.impressions;
      });
    });

    summary.avgEcpm = summary.totalImpressions > 0
      ? (summary.totalRevenue / summary.totalImpressions) * 1000
      : 0;

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Get revenue summary error:', error);
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
  trackAdUnitMetrics,
  getAdUnitAnalytics,
  getRevenueSummary
};
