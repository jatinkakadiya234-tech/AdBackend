// ==================== BACKEND: AdController.js (Enhanced) ====================
const mongoose = require('mongoose');
const Ad = require('./AdBanner');
const { validateURL, generateTrackingUrl, sanitizeInput } = require('../utils/validators');

const AdController = {
  // ✅ Create Ad with full validation
  createAd: async (req, res) => {
    try {
      const { width, height, imageUrl, clickUrl, title, description, ctaText, adType, adSize, rewardAmount, rewardType, videoDuration } = req.body;

      // Validation
      if (!width || !height || !imageUrl || !clickUrl) {
        return res.status(400).json({ 
          success: false,
          message: "Required fields: width, height, imageUrl, clickUrl" 
        });
      }

      // Validate dimensions
      if (width < 1 || width > 2000 || height < 1 || height > 2000) {
        return res.status(400).json({ 
          success: false,
          message: "Width and height must be between 1-2000" 
        });
      }

      // Validate URLs
      if (!validateURL(imageUrl) || !validateURL(clickUrl)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid URL format. Must be valid HTTP/HTTPS URL" 
        });
      }

      // Generate tracking URLs
      const impressionTrackingUrl = `${process.env.API_BASE_URL}/api/v1/ads/track-impression`;
      const clickTrackingUrl = `${process.env.API_BASE_URL}/api/v1/ads/track-click`;

      // Generate embed codes
      const embedCodeWeb = `<a href="${clickUrl}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl}" width="${width}" height="${height}" alt="${sanitizeInput(title || 'Ad Banner')}" style="border: none;" /></a>`;
      const embedCodeMobile = `<a href="${clickUrl}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl}" width="100%" height="auto" alt="${sanitizeInput(title || 'Ad Banner')}" style="max-width:${width}px; border: none;" /></a>`;

      // Create ad
      const newAd = new Ad({
        width,
        height,
        imageUrl,
        clickUrl,
        title: sanitizeInput(title) || 'Advertisement',
        description: sanitizeInput(description),
        ctaText: sanitizeInput(ctaText) || 'Learn More',
        adType: adType || 'banner',
        adSize: adSize || '320x50',
        rewardAmount: rewardAmount || 0,
        rewardType: sanitizeInput(rewardType) || 'coins',
        videoDuration: videoDuration || 0,
        createdBy: req.user.id,
        embedCodeWeb,
        embedCodeMobile,
        impressionTrackingUrl,
        clickTrackingUrl
      });

      await newAd.save();

      res.status(201).json({ 
        success: true,
        message: "Ad created successfully", 
        ad: newAd 
      });
    } catch (error) {
      console.error('Error in createAd:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to create ad",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // ✅ Get embed code (Web & Mobile SDK support)
  getEmbedCode: async (req, res) => {
    try {
      const { id } = req.params;
      const { platform } = req.query;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid Ad ID format" 
        });
      }

      const ad = await Ad.findById(id);
      if (!ad || ad.isDeleted || !ad.isActive) {
        return res.status(404).json({ 
          success: false,
          message: "Ad not found or inactive" 
        });
      }

      let embedCode;

      // Platform-specific embed codes
      switch(platform?.toLowerCase()) {
        case 'react':
          embedCode = `
<a href="${ad.clickUrl}" target="_blank" rel="noopener noreferrer">
  <img 
    src="${ad.imageUrl}" 
    width={${ad.width}} 
    height={${ad.height}} 
    alt="${ad.title}"
    style={{maxWidth: '100%', height: 'auto'}}
  />
</a>`;
          break;

        case 'php':
          embedCode = `<?php echo '<a href="${ad.clickUrl}" target="_blank"><img src="${ad.imageUrl}" width="${ad.width}" height="${ad.height}" alt="${ad.title}" /></a>'; ?>`;
          break;

        case 'java':
          embedCode = `String adHtml = "<a href=\\"${ad.clickUrl}\\" target=\\"_blank\\"><img src=\\"${ad.imageUrl}\\" width=\\"${ad.width}\\" height=\\"${ad.height}\\" alt=\\"${ad.title}\\" /></a>";`;
          break;

        case 'android':
        case 'ios':
        case 'flutter':
        case 'mobile':
          // Return SDK-compatible response
          return res.status(200).json({
            success: true,
            ad: {
              id: ad._id,
              placementId: ad.placementId,
              adType: ad.adType,
              adSize: ad.adSize,
              title: ad.title,
              description: ad.description,
              creativeUrl: ad.imageUrl,
              clickUrl: ad.clickUrl,
              ctaText: ad.ctaText,
              impressionTrackingUrl: ad.impressionTrackingUrl,
              clickTrackingUrl: ad.clickTrackingUrl,
              videoUrl: ad.videoUrl,
              rewardAmount: ad.rewardAmount,
              rewardType: ad.rewardType,
              videoDuration: ad.videoDuration
            }
          });

        case 'html':
        default:
          embedCode = ad.embedCodeWeb;
      }

      // Track impression
      await Ad.findByIdAndUpdate(id, { $inc: { impressions: 1 } });

      res.status(200).json({
        success: true,
        embedCode,
        platform: platform || 'html',
        adId: id
      });
    } catch (error) {
      console.error('Error in getEmbedCode:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to get embed code" 
      });
    }
  },

  // ✅ Get ads for user
  getAds: async (req, res) => {
    try {
      const { skip = 0, limit = 10, adType } = req.query;
      const skipNum = Math.max(0, parseInt(skip));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

      let query = { createdBy: req.user.id, isDeleted: false };
      if (adType) {
        query.adType = adType;
      }

      const ads = await Ad.find(query)
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum);

      const total = await Ad.countDocuments(query);

      res.status(200).json({ 
        success: true,
        ads,
        pagination: {
          skip: skipNum,
          limit: limitNum,
          total,
          hasMore: skipNum + limitNum < total
        }
      });
    } catch (error) {
      console.error('Error in getAds:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch ads" 
      });
    }
  },

  // ✅ Update ad
  updateAd: async (req, res) => {
    try {
      const { id } = req.params;
      const { width, height, imageUrl, clickUrl, title, description, ctaText, adType, adSize, rewardAmount, rewardType, videoDuration, isActive } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid Ad ID format" 
        });
      }

      const ad = await Ad.findOne({ _id: id, createdBy: req.user.id, isDeleted: false });
      if (!ad) {
        return res.status(404).json({ 
          success: false,
          message: "Ad not found" 
        });
      }

      // Validate and update fields
      if (width) {
        if (width < 1 || width > 2000) throw new Error('Width must be 1-2000');
        ad.width = width;
      }
      if (height) {
        if (height < 1 || height > 2000) throw new Error('Height must be 1-2000');
        ad.height = height;
      }
      if (imageUrl) {
        if (!validateURL(imageUrl)) throw new Error('Invalid image URL');
        ad.imageUrl = imageUrl;
      }
      if (clickUrl) {
        if (!validateURL(clickUrl)) throw new Error('Invalid click URL');
        ad.clickUrl = clickUrl;
      }
      if (title) ad.title = sanitizeInput(title);
      if (description) ad.description = sanitizeInput(description);
      if (ctaText) ad.ctaText = sanitizeInput(ctaText);
      if (adType) ad.adType = adType;
      if (adSize) ad.adSize = adSize;
      if (rewardAmount !== undefined) ad.rewardAmount = Math.max(0, rewardAmount);
      if (rewardType) ad.rewardType = sanitizeInput(rewardType);
      if (videoDuration !== undefined) ad.videoDuration = Math.max(0, videoDuration);
      if (typeof isActive === 'boolean') ad.isActive = isActive;

      // Regenerate embed codes if dimensions changed
      if (width || height || imageUrl || clickUrl) {
        ad.embedCodeWeb = `<a href="${ad.clickUrl}" target="_blank" rel="noopener noreferrer"><img src="${ad.imageUrl}" width="${ad.width}" height="${ad.height}" alt="${ad.title}" style="border: none;" /></a>`;
        ad.embedCodeMobile = `<a href="${ad.clickUrl}" target="_blank" rel="noopener noreferrer"><img src="${ad.imageUrl}" width="100%" height="auto" alt="${ad.title}" style="max-width:${ad.width}px; border: none;" /></a>`;
      }

      await ad.save();
      res.status(200).json({ 
        success: true,
        message: "Ad updated successfully", 
        ad 
      });
    } catch (error) {
      console.error('Error in updateAd:', error);
      res.status(400).json({ 
        success: false,
        message: error.message || "Failed to update ad" 
      });
    }
  },

  // ✅ Delete ad (soft delete)
  deleteAd: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid Ad ID format" 
        });
      }

      const ad = await Ad.findOneAndUpdate(
        { _id: id, createdBy: req.user.id, isDeleted: false },
        { isDeleted: true, isActive: false },
        { new: true }
      );

      if (!ad) {
        return res.status(404).json({ 
          success: false,
          message: "Ad not found" 
        });
      }

      res.status(200).json({ 
        success: true,
        message: "Ad deleted successfully" 
      });
    } catch (error) {
      console.error('Error in deleteAd:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to delete ad" 
      });
    }
  },

  // ✅ Track click
  trackClick: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid Ad ID format" 
        });
      }

      const ad = await Ad.findByIdAndUpdate(
        id,
        { 
          $inc: { clicks: 1 },
          lastClickedAt: new Date()
        },
        { new: true }
      );

      if (!ad) {
        return res.status(404).json({ 
          success: false,
          message: "Ad not found" 
        });
      }

      // For mobile: return JSON response
      const userAgent = req.headers['user-agent'] || '';
      if (userAgent.includes('Mobile') || req.query.format === 'json') {
        return res.status(200).json({
          success: true,
          message: "Click tracked",
          redirectUrl: ad.clickUrl
        });
      }

      // For web: redirect
      res.redirect(ad.clickUrl);
    } catch (error) {
      console.error('Error in trackClick:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to track click" 
      });
    }
  },

  // ✅ Track impression
  trackImpression: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid Ad ID format" 
        });
      }

      await Ad.findByIdAndUpdate(
        id,
        { $inc: { impressions: 1 } }
      );

      res.status(200).json({ 
        success: true,
        message: "Impression tracked" 
      });
    } catch (error) {
      console.error('Error in trackImpression:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to track impression" 
      });
    }
  },

  // ✅ Track reward (for rewarded ads)
  trackReward: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, rewardAmount } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid Ad ID format" 
        });
      }

      if (!rewardAmount || rewardAmount <= 0) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid reward amount" 
        });
      }

      const ad = await Ad.findByIdAndUpdate(
        id,
        { $inc: { rewards: 1 } },
        { new: true }
      );

      if (!ad) {
        return res.status(404).json({ 
          success: false,
          message: "Ad not found" 
        });
      }

      // TODO: Add reward to user account

      res.status(200).json({ 
        success: true,
        message: "Reward tracked",
        rewardAmount,
        rewardType: ad.rewardType
      });
    } catch (error) {
      console.error('Error in trackReward:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to track reward" 
      });
    }
  },

  // ✅ Get ad for mobile SDK
  getAdForMobileSDK: async (req, res) => {
    try {
      const { placementId } = req.params;
      const { adType = 'banner' } = req.query;

      const ad = await Ad.findOne({
        placementId,
        adType,
        isActive: true,
        isDeleted: false
      });

      if (!ad) {
        return res.status(404).json({
          success: false,
          message: "No ad available for this placement"
        });
      }

      // Track impression
      await Ad.findByIdAndUpdate(ad._id, { $inc: { impressions: 1 } });

      res.status(200).json({
        success: true,
        ad: {
          id: ad._id,
          placementId: ad.placementId,
          adType: ad.adType,
          adSize: ad.adSize,
          title: ad.title,
          description: ad.description,
          creativeUrl: ad.imageUrl,
          clickUrl: ad.clickUrl,
          ctaText: ad.ctaText,
          impressionTrackingUrl: ad.impressionTrackingUrl,
          clickTrackingUrl: ad.clickTrackingUrl,
          videoUrl: ad.videoUrl,
          rewardAmount: ad.rewardAmount,
          rewardType: ad.rewardType,
          videoDuration: ad.videoDuration
        }
      });
    } catch (error) {
      console.error('Error in getAdForMobileSDK:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch ad"
      });
    }
  }
};

module.exports = AdController;










// const Ad = require('./AdBanner');

// const AdController = {
//   crateAd: async (req, res) => {
//     try {
//       const { width, height, imageUrl, clickUrl } = req.body;
      
//       if (!width || !height || !imageUrl || !clickUrl) {
//         return res.status(400).json({ message: "All fields are required" });
//       }

//       const embedCodeWeb = `<a href="${clickUrl}" target="_blank"><img src="${imageUrl}" width="${width}" height="${height}" alt="Ad Banner" /></a>`;
//       const embedCodeMobile = `<a href="${clickUrl}" target="_blank"><img src="${imageUrl}" width="100%" height="auto" alt="Ad Banner" style="max-width:${width}px;" /></a>`;

//       const newAd = new Ad({
//         width,
//         height,
//         imageUrl,
//         clickUrl,
//         createdBy: req.user.id,
//         embedCodeWeb,
//         embedCodeMobile
//       });

//       await newAd.save();
//       res.status(201).json({ message: "Ad created successfully", ad: newAd });
//     } catch (error) {
//       console.log('Error in crateAd:', error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   },

//   getEmbedCode: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { platform } = req.query;
      
//       const ad = await Ad.findById(id);
//       if (!ad || !ad.isActive) {
//         return res.status(404).json({ message: "Ad not found" });
//       }

//       let embedCode;
      
//       switch(platform) {
//         case 'react':
//           embedCode = `<a href="${ad.clickUrl}" target="_blank" rel="noopener noreferrer">
//   <img 
//     src="${ad.imageUrl}" 
//     width={${ad.width}} 
//     height={${ad.height}} 
//     alt="Ad Banner" 
//     style={{maxWidth: '100%', height: 'auto'}}
//   />
// </a>`;
//           break;
          
//         case 'html':
//           embedCode = ad.embedCodeWeb;
//           break;
          
//         case 'php':
//           embedCode = `<?php echo '<a href="${ad.clickUrl}" target="_blank"><img src="${ad.imageUrl}" width="${ad.width}" height="${ad.height}" alt="Ad Banner" /></a>'; ?>`;
//           break;
          
//         case 'java':
//           embedCode = `String adHtml = "<a href=\"${ad.clickUrl}\" target=\"_blank\"><img src=\"${ad.imageUrl}\" width=\"${ad.width}\" height=\"${ad.height}\" alt=\"Ad Banner\" /></a>";`;
//           break;
          
//         case 'mobile':
//           embedCode = ad.embedCodeMobile;
//           break;
          
//         default:
//           embedCode = ad.embedCodeWeb;
//       }

//       await Ad.findByIdAndUpdate(id, { $inc: { impressions: 1 } });
      
//       res.status(200).json({ 
//         embedCode, 
//         platform: platform || 'html',
//         adId: id 
//       });
//     } catch (error) {
//       console.log('Error in getEmbedCode:', error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   },

//   getAds: async (req, res) => {
//     try {
//       const ads = await Ad.find({ createdBy: req.user.id }).populate('createdBy', 'username email');
//       res.status(200).json({ ads });
//     } catch (error) {
//       console.log('Error in getAds:', error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   },

//   updateAd: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { width, height, imageUrl, clickUrl, isActive } = req.body;

//       const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
//       if (!ad) {
//         return res.status(404).json({ message: "Ad not found" });
//       }

//       if (width) ad.width = width;
//       if (height) ad.height = height;
//       if (imageUrl) ad.imageUrl = imageUrl;
//       if (clickUrl) ad.clickUrl = clickUrl;
//       if (typeof isActive === 'boolean') ad.isActive = isActive;

//       if (width || height || imageUrl || clickUrl) {
//         ad.embedCodeWeb = `<a href="${ad.clickUrl}" target="_blank"><img src="${ad.imageUrl}" width="${ad.width}" height="${ad.height}" alt="Ad Banner" /></a>`;
//         ad.embedCodeMobile = `<a href="${ad.clickUrl}" target="_blank"><img src="${ad.imageUrl}" width="100%" height="auto" alt="Ad Banner" style="max-width:${ad.width}px;" /></a>`;
//       }

//       await ad.save();
//       res.status(200).json({ message: "Ad updated successfully", ad });
//     } catch (error) {
//       console.log('Error in updateAd:', error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   },

//   deleteAd: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const ad = await Ad.findOneAndDelete({ _id: id, createdBy: req.user.id });
      
//       if (!ad) {
//         return res.status(404).json({ message: "Ad not found" });
//       }

//       res.status(200).json({ message: "Ad deleted successfully" });
//     } catch (error) {
//       console.log('Error in deleteAd:', error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   },

//   trackClick: async (req, res) => {
//     try {
//       const { id } = req.params;
      
//       if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
//         return res.status(400).json({ message: "Invalid Ad ID format" });
//       }
      
//       const ad = await Ad.findByIdAndUpdate(
//         id,
//         { $inc: { clicks: 1 } },
//         { new: true }
//       );

//       if (!ad) {
//         return res.status(404).json({ message: "Ad not found" });
//       }

//       res.redirect(ad.clickUrl);
//     } catch (error) {
//       console.log("Error in trackClick:", error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   },

//   trackImpression: async (req, res) => {
//     try {
//       const { id } = req.params;
//       await Ad.findByIdAndUpdate(id, { $inc: { impressions: 1 } });
//       res.status(200).json({ message: "Impression tracked" });
//     } catch (error) {
//       console.log('Error in trackImpression:', error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   }
// };



// module.exports = AdController;