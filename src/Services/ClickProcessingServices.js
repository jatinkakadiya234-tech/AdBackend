// services/clickProcessingService.js (UPDATED)

class ClickProcessingService {
  
  static async processClick(clickData) {
    const {
      adId,
      campaignId,
      publisherId,
      viewerId,
      adUnitId,
      platformId,
      ipAddress,
      userAgent,
      deviceType,
      platform,
      sdk,
      sdkVersion,
      sessionId,
      fingerprint,
      context
    } = clickData;
    
    try {
      // 1. Hash IP
      const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');
      
      // 2. Find or create IP tracking
      let ipTracking = await IPTracking.findOne({ ipHash });
      if (!ipTracking) {
        ipTracking = new IPTracking({ ipAddress, ipHash });
        const geo = geoip.lookup(ipAddress);
        if (geo) {
          ipTracking.location = {
            country: geo.country,
            countryCode: geo.countryCode,
            region: geo.region
          };
        }
      }
      
      // 3. Check if click is allowed (fraud prevention)
      const canClick = ipTracking.canClick(adId);
      
      const Ad = require('../models/Ad');
      const ad = await Ad.findById(adId);
      
      if (!canClick) {
        // ===== BLOCKED CLICK =====
        
        // Create analytics event marked as blocked
        const blockedEvent = await AnalyticsEvent.create({
          eventId: uuidv4(),
          eventType: 'click',
          timestamp: new Date(),
          adId,
          campaignId,
          publisherId,
          viewerId,
          adUnitId,
          platformId,
          user: {
            ipHash,
            userAgent,
            device: { type: deviceType },
            platform,
            sdk,
            sdkVersion
          },
          fraud: {
            isSuspicious: true,
            isBlocked: true,
            blockReason: 'Daily click limit exceeded (10 clicks per IP)',
            fraudScore: ipTracking.fraudScore
          }
        });
        
        // Record blocked click in Ad metrics
        await ad.recordBlockedClick();
        
        // Update ad unit
        if (adUnitId) {
          const AdUnit = require('../models/AdUnit');
          const adUnit = await AdUnit.findById(adUnitId);
          if (adUnit) {
            // Create method for recording blocked clicks on ad unit too
            adUnit.stats.blockedClicks = (adUnit.stats.blockedClicks || 0) + 1;
            await adUnit.save();
          }
        }
        
        // Record blocked click in IP tracking
        await ipTracking.recordClick(clickData, 'blocked');
        
        return {
          success: false,
          blocked: true,
          reason: 'Click limit exceeded for this IP',
          eventId: blockedEvent.eventId
        };
      }
      
      // ===== ALLOWED CLICK =====
      
      // Calculate fraud score for this click
      const fraudScore = ipTracking.calculateFraudScore();
      const isSuspicious = fraudScore >= 50;
      
      // Record click in IP tracking
      await ipTracking.recordClick(clickData, isSuspicious ? 'suspicious' : 'valid');
      
      // Create analytics event
      const event = await AnalyticsEvent.create({
        eventId: uuidv4(),
        eventType: 'click',
        timestamp: new Date(),
        adId,
        campaignId,
        publisherId,
        viewerId,
        adUnitId,
        platformId,
        placement: {
          adUnitCode: context?.adUnitCode,
          adUnitType: context?.adUnitType,
          position: context?.position
        },
        user: {
          ipHash,
          userAgent,
          device: { type: deviceType },
          platform,
          sdk,
          sdkVersion
        },
        fraud: {
          isSuspicious,
          fraudScore,
          isBlocked: false
        }
      });
      
      // ===== Update Ad metrics based on fraud status =====
      if (isSuspicious) {
        await ad.recordSuspiciousClick();
      } else {
        await ad.recordValidClick();
      }
      
      // ===== Update Ad Unit metrics =====
      if (adUnitId) {
        const AdUnit = require('../models/AdUnit');
        const adUnit = await AdUnit.findById(adUnitId);
        if (adUnit) {
          if (isSuspicious) {
            adUnit.stats.suspiciousClicks = (adUnit.stats.suspiciousClicks || 0) + 1;
          }
          await adUnit.recordClick();
        }
      }
      
      return {
        success: true,
        blocked: false,
        fraudulent: isSuspicious,
        eventId: event.eventId,
        fraudScore
      };
      
    } catch (error) {
      console.error('Click processing error:', error);
      throw error;
    }
  }
  
  static async processImpression(impressionData) {
    const {
      adId,
      campaignId,
      publisherId,
      viewerId,
      adUnitId,
      platformId,
      ipAddress,
      userAgent,
      deviceType,
      platform,
      sdk
    } = impressionData;
    
    try {
      const Ad = require('../models/Ad');
      const ad = await Ad.findById(adId);
      
      // Record valid impression
      await ad.recordValidImpression();
      
      // Update ad unit
      if (adUnitId) {
        const AdUnit = require('../models/AdUnit');
        const adUnit = await AdUnit.findById(adUnitId);
        if (adUnit) {
          await adUnit.recordImpression();
        }
      }
      
      // Create analytics event
      const event = await AnalyticsEvent.create({
        eventId: uuidv4(),
        eventType: 'impression',
        timestamp: new Date(),
        adId,
        campaignId,
        publisherId,
        viewerId,
        adUnitId,
        platformId,
        user: {
          ipAddress: crypto.createHash('sha256').update(ipAddress).digest('hex'),
          userAgent,
          device: { type: deviceType },
          platform,
          sdk
        },
        fraud: {
          isBlocked: false
        }
      });
      
      return { success: true, eventId: event.eventId };
      
    } catch (error) {
      console.error('Impression processing error:', error);
      throw error;
    }
  }
}

module.exports = ClickProcessingService;
