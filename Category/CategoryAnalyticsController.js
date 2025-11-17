const Category = require('./CategoryModel');
const Ad = require('../Ad-banner/AdBanner');

const CategoryAnalyticsController = {
  // Get category with ad count
  getCategoryStats: async (req, res) => {
    try {
      const categories = await Category.find();
      
      const categoryStats = await Promise.all(
        categories.map(async (category) => {
          const adCount = await Ad.countDocuments({ 
            category: category._id, 
            isActive: true 
          });
          
          const totalImpressions = await Ad.aggregate([
            { $match: { category: category._id, isActive: true } },
            { $group: { _id: null, total: { $sum: '$analytics.impressions' } } }
          ]);
          
          const totalClicks = await Ad.aggregate([
            { $match: { category: category._id, isActive: true } },
            { $group: { _id: null, total: { $sum: '$analytics.clicks' } } }
          ]);
          
          return {
            ...category.toObject(),
            adCount,
            totalImpressions: totalImpressions[0]?.total || 0,
            totalClicks: totalClicks[0]?.total || 0,
            ctr: totalImpressions[0]?.total > 0 
              ? ((totalClicks[0]?.total || 0) / totalImpressions[0].total * 100).toFixed(2)
              : 0
          };
        })
      );
      
      res.status(200).json({ 
        message: "Category stats fetched successfully",
        categories: categoryStats 
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching category stats", error: error.message });
    }
  },

  // Get ads by category
  getAdsByCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const skip = (page - 1) * limit;
      
      const ads = await Ad.find({ category: id, isActive: true })
        .populate('createdBy', 'username email')
        .populate('category', 'name description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const totalAds = await Ad.countDocuments({ category: id, isActive: true });
      
      res.status(200).json({
        message: "Ads fetched successfully",
        category: category.name,
        ads,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalAds / limit),
          totalAds,
          hasNext: page * limit < totalAds,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching ads by category", error: error.message });
    }
  },

  // Get top performing categories
  getTopCategories: async (req, res) => {
    try {
      const { limit = 5 } = req.query;
      
      const topCategories = await Ad.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            totalAds: { $sum: 1 },
            totalImpressions: { $sum: '$analytics.impressions' },
            totalClicks: { $sum: '$analytics.clicks' },
            avgImpressions: { $avg: '$analytics.impressions' }
          }
        },
        {
          $lookup: {
            from: 'tbl_categorys',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $unwind: '$categoryInfo' },
        {
          $project: {
            name: '$categoryInfo.name',
            description: '$categoryInfo.description',
            totalAds: 1,
            totalImpressions: 1,
            totalClicks: 1,
            avgImpressions: { $round: ['$avgImpressions', 2] },
            ctr: {
              $cond: {
                if: { $gt: ['$totalImpressions', 0] },
                then: { $round: [{ $multiply: [{ $divide: ['$totalClicks', '$totalImpressions'] }, 100] }, 2] },
                else: 0
              }
            }
          }
        },
        { $sort: { totalImpressions: -1 } },
        { $limit: parseInt(limit) }
      ]);
      
      res.status(200).json({
        message: "Top categories fetched successfully",
        categories: topCategories
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching top categories", error: error.message });
    }
  },

  // Get category performance over time
  getCategoryTrends: async (req, res) => {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;
      
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const trends = await Ad.aggregate([
        { 
          $match: { 
            category: category._id, 
            isActive: true,
            createdAt: { $gte: startDate }
          } 
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            adsCreated: { $sum: 1 },
            totalImpressions: { $sum: '$analytics.impressions' },
            totalClicks: { $sum: '$analytics.clicks' }
          }
        },
        {
          $project: {
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day'
              }
            },
            adsCreated: 1,
            totalImpressions: 1,
            totalClicks: 1,
            ctr: {
              $cond: {
                if: { $gt: ['$totalImpressions', 0] },
                then: { $round: [{ $multiply: [{ $divide: ['$totalClicks', '$totalImpressions'] }, 100] }, 2] },
                else: 0
              }
            }
          }
        },
        { $sort: { date: 1 } }
      ]);
      
      res.status(200).json({
        message: "Category trends fetched successfully",
        category: category.name,
        trends
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching category trends", error: error.message });
    }
  }
};

module.exports = CategoryAnalyticsController;