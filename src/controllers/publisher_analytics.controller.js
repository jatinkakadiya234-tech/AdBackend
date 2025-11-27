const PublisherAnalytics = require('../models/PublisherAnalytics');
const Campaign = require('../models/Campaign');

// ============================================
// TRACK PUBLISHER METRICS
// ============================================
const trackPublisherMetrics = async (req, res) => {
  try {
    const { publisherId, impressions = 0, clicks = 0, conversions = 0, spend = 0, activeCampaigns, activeAds } = req.body;

    if (!publisherId) {
      return res.status(400).json({
        success: false,
        message: 'Publisher ID is required'
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

    let analytics = await PublisherAnalytics.findOne({
      publisherId,
      date: today
    });

    if (!analytics) {
      analytics = new PublisherAnalytics({
        publisherId,
        date: today,
        metrics: {
          impressions,
          clicks,
          conversions,
          spend,
          activeCampaigns: activeCampaigns || 0,
          activeAds: activeAds || 0
        }
      });
    } else {
      analytics.metrics.impressions += impressions;
      analytics.metrics.clicks += clicks;
      analytics.metrics.conversions += conversions;
      analytics.metrics.spend += spend;
      if (activeCampaigns !== undefined) analytics.metrics.activeCampaigns = activeCampaigns;
      if (activeAds !== undefined) analytics.metrics.activeAds = activeAds;
    }

    // Calculate metrics
    if (analytics.metrics.clicks > 0) {
      analytics.metrics.cpc = analytics.metrics.spend / analytics.metrics.clicks;
    }

    if (analytics.metrics.impressions > 0) {
      analytics.metrics.cpm = (analytics.metrics.spend / analytics.metrics.impressions) * 1000;
    }

    if (analytics.metrics.conversions > 0) {
      analytics.metrics.cpa = analytics.metrics.spend / analytics.metrics.conversions;
    }

    await analytics.save();

    res.json({
      success: true,
      message: 'Publisher metrics tracked',
      analytics
    });

  } catch (error) {
    console.error('Track publisher metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET PUBLISHER ANALYTICS
// ============================================
const getPublisherAnalytics = async (req, res) => {
  try {
    const publisherId = req.user._id;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = { publisherId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      query.date = { $gte: start, $lte: end };
    }

    const analytics = await PublisherAnalytics.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('topCampaigns.campaignId', 'campaignName');

    const total = await PublisherAnalytics.countDocuments(query);

    // Calculate aggregate metrics
    const aggregateMetrics = {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      avgCpc: 0,
      avgCpm: 0,
      avgCpa: 0
    };

    analytics.forEach(a => {
      aggregateMetrics.totalImpressions += a.metrics.impressions;
      aggregateMetrics.totalClicks += a.metrics.clicks;
      aggregateMetrics.totalConversions += a.metrics.conversions;
      aggregateMetrics.totalSpend += a.metrics.spend;
      aggregateMetrics.avgCpc += a.metrics.cpc;
      aggregateMetrics.avgCpm += a.metrics.cpm;
      aggregateMetrics.avgCpa += a.metrics.cpa;
    });

    if (analytics.length > 0) {
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
    console.error('Get publisher analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET PUBLISHER DASHBOARD
// ============================================
const getPublisherDashboard = async (req, res) => {
  try {
    const publisherId = req.user._id;

    // Get today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAnalytics = await PublisherAnalytics.findOne({
      publisherId,
      date: today
    });

    // Get active campaigns
    const activeCampaigns = await Campaign.countDocuments({
      publisherId,
      status: 'active'
    });

    // Get last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekAnalytics = await PublisherAnalytics.find({
      publisherId,
      date: { $gte: sevenDaysAgo }
    });

    const weekMetrics = {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0
    };

    weekAnalytics.forEach(a => {
      weekMetrics.totalSpend += a.metrics.spend;
      weekMetrics.totalImpressions += a.metrics.impressions;
      weekMetrics.totalClicks += a.metrics.clicks;
      weekMetrics.totalConversions += a.metrics.conversions;
    });

    const dashboard = {
      today: todayAnalytics?.metrics || {},
      week: weekMetrics,
      activeCampaigns,
      topCampaigns: todayAnalytics?.topCampaigns || []
    };

    res.json({
      success: true,
      dashboard
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
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
  trackPublisherMetrics,
  getPublisherAnalytics,
  getPublisherDashboard
};
