// services/analyticsAggregationService.js (UPDATED)

class analyticsAggregationService {
    
    static async aggregateCampaigns(startDate, endDate) {
        const events = await AnalyticsEvent.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate, $lte: endDate },
                    'fraud.isBlocked': false // Only count non-blocked events
                }
            },
            {
                $group: {
                    _id: {
                        campaignId: '$campaignId',
                        publisherId: '$publisherId',
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                    },

                    // Valid metrics (non-blocked)
                    impressions: {
                        $sum: { $cond: [{ $eq: ['$eventType', 'impression'] }, 1, 0] }
                    },
                    validClicks: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$eventType', 'click'] },
                                        { $eq: ['$fraud.isSuspicious', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    // Fraudulent metrics (for reporting)
                    blockedClicks: {
                        $sum: {
                            $cond: [
                                { $eq: ['$fraud.isBlocked', true] },
                                1,
                                0
                            ]
                        }
                    },
                    suspiciousClicks: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$eventType', 'click'] },
                                        { $eq: ['$fraud.isSuspicious', true] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    conversions: {
                        $sum: { $cond: [{ $eq: ['$eventType', 'conversion'] }, 1, 0] }
                    },
                    spend: { $sum: '$revenue.publisherCost' }
                }
            }
        ]);

        // Upsert to CampaignAnalytics
        for (const event of events) {
            const ctr = event.impressions > 0
                ? (event.validClicks / event.impressions) * 100
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
                        'metrics.clicks': event.validClicks, // Only valid clicks
                        'metrics.conversions': event.conversions,
                        'metrics.spend': event.spend,
                        'metrics.ctr': ctr,
                        'fraud.blockedClicks': event.blockedClicks,
                        'fraud.suspiciousClicks': event.suspiciousClicks,
                        updatedAt: new Date()
                    }
                },
                { upsert: true, new: true }
            );
        }
    }
}