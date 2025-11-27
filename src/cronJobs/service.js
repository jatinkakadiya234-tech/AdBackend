// services/analyticsAggregationService.js
const AnalyticsEvent = require('../models/AnalyticsEvent');
const CampaignAnalytics = require('../models/CampaignAnalytics');
const AdAnalytics = require('../models/AdAnalytics');
const ViewerAnalytics = require('../models/ViewerAnalytics');
const PublisherAnalytics = require('../models/PublisherAnalytics');

class AnalyticsAggregationService {
  
  /**
   * Aggregate analytics for a specific date
   * Run this hourly or daily
   */
  static async aggregateByDate(date = new Date()) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    console.log(`Aggregating analytics for ${startOfDay.toISOString()}`);
    
    try {
      // Aggregate in parallel
      await Promise.all([
        this.aggregateCampaigns(startOfDay, endOfDay),
        this.aggregateAds(startOfDay, endOfDay),
        this.aggregateViewers(startOfDay, endOfDay),
        this.aggregatePublishers(startOfDay, endOfDay)
      ]);
      
      console.log('Analytics aggregation completed');
    } catch (error) {
      console.error('Aggregation error:', error);
      throw error;
    }
  }
  
  /**
   * Aggregate campaign analytics
   */
  static async aggregateCampaigns(startDate, endDate) {
    const events = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          'fraud.isBlocked': false
        }
      },
      {
        $group: {
          _id: {
            campaignId: '$campaignId',
            publisherId: '$publisherId',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          impressions: {
            $sum: { $cond: [{ $eq: ['$eventType', 'impression'] }, 1, 0] }
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] }
          },
          conversions: {
            $sum: { $cond: [{ $eq: ['$eventType', 'conversion'] }, 1, 0] }
          },
          spend: { $sum: '$revenue.publisherCost' },
          uniqueIPs: { $addToSet: '$user.ipHash' }
        }
      }
    ]);
    
    // Upsert to CampaignAnalytics
    for (const event of events) {
      const ctr = event.impressions > 0 
        ? (event.clicks / event.impressions) * 100 
        : 0;
      
      const conversionRate = event.clicks > 0 
        ? (event.conversions / event.clicks) * 100 
        : 0;
      
      await CampaignAnalytics.findOneAndUpdate(
        {
          campaignId: event._id.campaignId,
          publisherId: event._id.publisherId,
          date: new Date(event._id.date)
        },
        {
          $set: {
            'metrics.impressions': event.impressions,
            'metrics.clicks': event.clicks,
            'metrics.conversions': event.conversions,
            'metrics.spend': event.spend,
            'metrics.ctr': ctr,
            'metrics.conversionRate': conversionRate,
            'metrics.uniqueIPs': event.uniqueIPs.length,
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
    }
  }
  
  /**
   * Similar aggregation methods for Ads, Viewers, Publishers
   */
  static async aggregateAds(startDate, endDate) {
    // Similar to aggregateCampaigns but grouped by adId
  }
  
  static async aggregateViewers(startDate, endDate) {
    // Group by viewerId and calculate earnings
  }
  
  static async aggregatePublishers(startDate, endDate) {
    // Group by publisherId and calculate spend
  }
}

module.exports = AnalyticsAggregationService;
