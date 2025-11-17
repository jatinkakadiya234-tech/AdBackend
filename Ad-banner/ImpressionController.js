const Ad = require('./AdBanner');

const ImpressionController = {
  // Track impression when ad is viewed
  trackImpression: async (req, res) => {
    try {
      const { id } = req.params;
      const { device = 'web', platform = 'html', referrer, userAgent, isClick = false } = req.body;
      
      const ad = await Ad.findById(id);
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      const clickCost = 0.10;
      
      // If this is a click, check wallet balance
      if (isClick && ad.wallet.balance < clickCost) {
        // Deactivate ad if no balance for click
        await Ad.findByIdAndUpdate(id, { isActive: false });
        return res.status(400).json({ 
          message: "Ad deactivated due to insufficient wallet balance",
          adDeactivated: true
        });
      }

      // Update impression counts
      const impressionField = device === 'mobile' ? 'analytics.mobileImpressions' : 'analytics.webImpressions';
      const updateData = {
        $inc: {
          'analytics.impressions': 1,
          [impressionField]: 1
        }
      };
      
      // If this is a click, also increment click counts and deduct cost
      if (isClick) {
        const clickField = device === 'mobile' ? 'analytics.mobileClicks' : 'analytics.webClicks';
        updateData.$inc['analytics.clicks'] = 1;
        updateData.$inc[clickField] = 1;
        updateData.$inc['wallet.totalSpent'] = clickCost;
        updateData.$set = { 'wallet.balance': ad.wallet.balance - clickCost };
      }
      
      await Ad.findByIdAndUpdate(id, updateData);

      res.status(200).json({ 
        message: isClick ? "Click tracked and payment deducted" : "Impression tracked successfully",
        totalImpressions: ad.analytics.impressions + 1,
        totalClicks: isClick ? (ad.analytics.clicks + 1) : ad.analytics.clicks,
        ...(isClick && { clickCost, remainingBalance: ad.wallet.balance - clickCost })
      });
    } catch (error) {
      console.log('Error tracking impression:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Get impression analytics
  getImpressionStats: async (req, res) => {
    try {
      const { id } = req.params;
      const { days = 7 } = req.query;
      
      const ad = await Ad.findById(id);
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      // Get daily impression data (mock for now)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const dailyStats = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyStats.push({
          date: date.toISOString().split('T')[0],
          impressions: Math.floor(Math.random() * 100) + 10,
          clicks: Math.floor(Math.random() * 20) + 1
        });
      }

      res.status(200).json({
        message: "Impression stats fetched successfully",
        ad: {
          id: ad._id,
          title: ad.title,
          totalImpressions: ad.analytics.impressions,
          totalClicks: ad.analytics.clicks,
          webImpressions: ad.analytics.webImpressions,
          mobileImpressions: ad.analytics.mobileImpressions,
          ctr: ad.analytics.impressions > 0 
            ? ((ad.analytics.clicks / ad.analytics.impressions) * 100).toFixed(2)
            : 0
        },
        dailyStats: dailyStats.reverse()
      });
    } catch (error) {
      console.log('Error getting impression stats:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Get top performing ads by impressions
  getTopAds: async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      
      const topAds = await Ad.find({ isActive: true })
        .sort({ 'analytics.impressions': -1 })
        .limit(parseInt(limit))
        .populate('category', 'name')
        .populate('createdBy', 'username');

      const adsWithStats = topAds.map(ad => ({
        id: ad._id,
        title: ad.title,
        category: ad.category?.name || 'Uncategorized',
        creator: ad.createdBy?.username || 'Unknown',
        impressions: ad.analytics.impressions,
        clicks: ad.analytics.clicks,
        ctr: ad.analytics.impressions > 0 
          ? ((ad.analytics.clicks / ad.analytics.impressions) * 100).toFixed(2)
          : 0,
        mediaType: ad.mediaType,
        dimensions: `${ad.width}x${ad.height}`
      }));

      res.status(200).json({
        message: "Top ads fetched successfully",
        ads: adsWithStats
      });
    } catch (error) {
      console.log('Error getting top ads:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Get impression summary for dashboard
  getImpressionSummary: async (req, res) => {
    try {
      const totalAds = await Ad.countDocuments({ isActive: true });
      
      const impressionStats = await Ad.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalImpressions: { $sum: '$analytics.impressions' },
            totalClicks: { $sum: '$analytics.clicks' },
            webImpressions: { $sum: '$analytics.webImpressions' },
            mobileImpressions: { $sum: '$analytics.mobileImpressions' },
            avgImpressions: { $avg: '$analytics.impressions' }
          }
        }
      ]);

      const stats = impressionStats[0] || {
        totalImpressions: 0,
        totalClicks: 0,
        webImpressions: 0,
        mobileImpressions: 0,
        avgImpressions: 0
      };

      const ctr = stats.totalImpressions > 0 
        ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2)
        : 0;

      res.status(200).json({
        message: "Impression summary fetched successfully",
        summary: {
          totalAds,
          totalImpressions: stats.totalImpressions,
          totalClicks: stats.totalClicks,
          webImpressions: stats.webImpressions,
          mobileImpressions: stats.mobileImpressions,
          avgImpressions: Math.round(stats.avgImpressions),
          overallCTR: ctr
        }
      });
    } catch (error) {
      console.log('Error getting impression summary:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = ImpressionController;