// const Ad = require('./AdBanner');

// const AdController = {
//   createAd: async (req, res) => {
//     try {
//       const { title, width, height, mediaUrl: mediaUrlBody, mediaType: mediaTypeBody, clickUrl, targetDevices, targetPlatforms, schedule } = req.body;

//       let mediaUrl = mediaUrlBody;
//       let mediaType = mediaTypeBody;

//       if (req.file) {
//         const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
//         mediaUrl = fileUrl;
//         if (req.file.mimetype.startsWith('video/')) {
//           mediaType = 'video';
//         } else if (req.file.mimetype === 'image/gif') {
//           mediaType = 'gif';
//         } else if (req.file.mimetype.startsWith('image/')) {
//           mediaType = 'image';
//         }
//       }

//       if (!title || !width || !height || !clickUrl || !mediaUrl) {
//         return res.status(400).json({ message: "Title, width, height, mediaUrl (or file), and clickUrl are required" });
//       }

//       if (!mediaType) {
//         if (mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.toLowerCase().endsWith('.webm') || mediaUrl.toLowerCase().endsWith('.ogg')) {
//           mediaType = 'video';
//         } else if (mediaUrl.toLowerCase().endsWith('.gif')) {
//           mediaType = 'gif';
//         } else {
//           mediaType = 'image';
//         }
//       }

//       const embedFor = (platform) => {
//         if (platform === 'react') {
//           if (mediaType === 'video') {
//             return `<a href="${clickUrl}" target="_blank" rel="noopener noreferrer">\n  <video src="${mediaUrl}" width={${width}} height={${height}} controls style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
//           }
//           return `<a href="${clickUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${mediaUrl}" width={${width}} height={${height}} alt="${title}" style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
//         }
//         if (platform === 'php') {
//           if (mediaType === 'video') {
//             return `<?php echo '<a href="${clickUrl}" target="_blank"><video src="${mediaUrl}" width="${width}" height="${height}" controls></video></a>'; ?>`;
//           }
//           return `<?php echo '<a href="${clickUrl}" target="_blank"><img src="${mediaUrl}" width="${width}" height="${height}" alt="${title}" /></a>'; ?>`;
//         }
//         if (platform === 'java') {
//           if (mediaType === 'video') {
//             return `String adHtml = "<a href=\\"${clickUrl}\\" target=\\"_blank\\"><video src=\\"${mediaUrl}\\" width=\\"${width}\\" height=\\"${height}\\" controls></video></a>";`;
//           }
//           return `String adHtml = "<a href=\\"${clickUrl}\\" target=\\"_blank\\"><img src=\\"${mediaUrl}\\" width=\\"${width}\\" height=\\"${height}\\" alt=\\"${title}\\" /></a>";`;
//         }
//         if (platform === 'flutter') {
//           if (mediaType === 'video') {
//             return `GestureDetector(\n  onTap: () => launch('${clickUrl}'),\n  child: Text('Video: ${mediaUrl}'),\n)`;
//           }
//           return `GestureDetector(\n  onTap: () => launch('${clickUrl}'),\n  child: Image.network('${mediaUrl}', width: ${width}, height: ${height})\n)`;
//         }
//         if (platform === 'swift') {
//           if (mediaType === 'video') {
//             return `let label = UILabel()\nlabel.text = "Video: ${mediaUrl}"`;
//           }
//           return `let imageView = UIImageView()\nimageView.sd_setImage(with: URL(string: "${mediaUrl}"))\nlet tapGesture = UITapGestureRecognizer(target: self, action: #selector(openURL))\nimageView.addGestureRecognizer(tapGesture)`;
//         }
//         if (platform === 'mobile') {
//           if (mediaType === 'video') {
//             return `<a href="${clickUrl}" target="_blank"><video src="${mediaUrl}" width="100%" height="auto" controls style="max-width:${width}px;"></video></a>`;
//           }
//           return `<a href="${clickUrl}" target="_blank"><img src="${mediaUrl}" width="100%" height="auto" alt="${title}" style="max-width:${width}px;" /></a>`;
//         }
//         if (mediaType === 'video') {
//           return `<a href="${clickUrl}" target="_blank"><video src="${mediaUrl}" width="${width}" height="${height}" controls></video></a>`;
//         }
//         return `<a href="${clickUrl}" target="_blank"><img src="${mediaUrl}" width="${width}" height="${height}" alt="${title}" /></a>`;
//       };

//       const embedCodes = {
//         web: embedFor('web'),
//         mobile: embedFor('mobile'),
//         react: embedFor('react'),
//         php: embedFor('php'),
//         java: embedFor('java'),
//         flutter: embedFor('flutter'),
//         swift: embedFor('swift')
//       };

//       const newAd = new Ad({
//         title,
//         width,
//         height,
//         mediaUrl,
//         mediaType,
//         clickUrl,
//         createdBy: req.user.id,
//         targetDevices: targetDevices || ['web', 'mobile'],
//         targetPlatforms: targetPlatforms || ['html'],
//         embedCodes,
//         schedule: schedule || { isScheduled: false }
//       });

//       await newAd.save();
//       res.status(201).json({ message: "Ad created successfully", ad: newAd });
//     } catch (error) {
//       console.log('Error in createAd:', error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   },

//   getAdByDevice: async (req, res) => {
//   try {
//     const { device, platform } = req.query;
//     const { id } = req.params;

//     // ✅ Validate ID format
//     if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
//       return res.status(400).json({ message: "Invalid Ad ID format" });
//     }

//     // ✅ Find Ad
//     const ad = await Ad.findById(id);
//     if (!ad || !ad.isActive) {
//       return res.status(404).json({ message: "Ad not found or inactive" });
//     }

//     // ✅ Device & Platform Filtering
//     if (device && !ad.targetDevices.includes(device)) {
//       return res.status(400).json({ message: `Ad not available for ${device} devices` });
//     }
//     if (platform && !ad.targetPlatforms.includes(platform)) {
//       return res.status(400).json({ message: `Ad not available for ${platform} platform` });
//     }

//     // ✅ Schedule Check
//     if (ad.schedule.isScheduled) {
//       const now = new Date();
//       if (ad.schedule.startDate && now < ad.schedule.startDate) {
//         return res.status(400).json({ message: "Ad not yet active" });
//       }
//       if (ad.schedule.endDate && now > ad.schedule.endDate) {
//         return res.status(400).json({ message: "Ad has expired" });
//       }
//     }

//     // ✅ Select embed code dynamically
//     let embedCode = ad.embedCodes.web;
//     if (platform && ad.embedCodes[platform]) {
//       embedCode = ad.embedCodes[platform];
//     } else if (device === 'mobile') {
//       embedCode = ad.embedCodes.mobile;
//     }

//     // ✅ Track impression
//     const updateField = device === 'mobile' ? 'analytics.mobileImpressions' : 'analytics.webImpressions';
//     await Ad.findByIdAndUpdate(id, {
//       $inc: {
//         'analytics.impressions': 1,
//         [updateField]: 1
//       }
//     });

//     // ✅ Send full ad data + embed code
//     res.status(200).json({
//       message: "Ad fetched successfully",
//       ad: {
//         ...ad.toObject(),
//         embedCode,
//         device: device || 'web',
//         platform: platform || 'html'
//       }
//     });

//   } catch (error) {
//     console.log('Error in getAdByDevice:', error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// },


//   getAds: async (req, res) => {
//     try {
//       const { device, platform } = req.query;
//       let filter = { createdBy: req.user.id };

//       if (device) filter.targetDevices = device;
//       if (platform) filter.targetPlatforms = platform;

//       const ads = await Ad.find(filter).populate('createdBy', 'username email');
//       res.status(200).json({ ads });
//     } catch (error) {
//       console.log('Error in getAds:', error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   },

//   updateAd: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { title, width, height, mediaUrl: mediaUrlBody, mediaType: mediaTypeBody, clickUrl, isActive, targetDevices, targetPlatforms, schedule } = req.body;

//       const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
//       if (!ad) {
//         return res.status(404).json({ message: "Ad not found" });
//       }

//       let mediaUrl = mediaUrlBody;
//       let mediaType = mediaTypeBody;

//       if (req.file) {
//         const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
//         mediaUrl = fileUrl;
//         if (req.file.mimetype.startsWith('video/')) {
//           mediaType = 'video';
//         } else if (req.file.mimetype === 'image/gif') {
//           mediaType = 'gif';
//         } else if (req.file.mimetype.startsWith('image/')) {
//           mediaType = 'image';
//         }
//       }

//       if (title) ad.title = title;
//       if (width) ad.width = width;
//       if (height) ad.height = height;
//       if (mediaUrl) ad.mediaUrl = mediaUrl;
//       if (mediaType) ad.mediaType = mediaType;
//       if (clickUrl) ad.clickUrl = clickUrl;
//       if (typeof isActive === 'boolean') ad.isActive = isActive;
//       if (targetDevices) ad.targetDevices = targetDevices;
//       if (targetPlatforms) ad.targetPlatforms = targetPlatforms;
//       if (schedule) ad.schedule = { ...ad.schedule, ...schedule };

//       if (!ad.mediaType) {
//         if ((ad.mediaUrl || '').toLowerCase().endsWith('.mp4') || (ad.mediaUrl || '').toLowerCase().endsWith('.webm') || (ad.mediaUrl || '').toLowerCase().endsWith('.ogg')) {
//           ad.mediaType = 'video';
//         } else if ((ad.mediaUrl || '').toLowerCase().endsWith('.gif')) {
//           ad.mediaType = 'gif';
//         } else {
//           ad.mediaType = 'image';
//         }
//       }

//       // Regenerate embed codes if content changed
//       if (title || width || height || mediaUrl || mediaType || clickUrl) {
//         const embedFor = (platform) => {
//           if (platform === 'react') {
//             if (ad.mediaType === 'video') {
//               return `<a href="${ad.clickUrl}" target="_blank" rel="noopener noreferrer">\n  <video src="${ad.mediaUrl}" width={${ad.width}} height={${ad.height}} controls style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
//             }
//             return `<a href="${ad.clickUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${ad.mediaUrl}" width={${ad.width}} height={${ad.height}} alt="${ad.title}" style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
//           }
//           if (platform === 'php') {
//             if (ad.mediaType === 'video') {
//               return `<?php echo '<a href="${ad.clickUrl}" target="_blank"><video src="${ad.mediaUrl}" width="${ad.width}" height="${ad.height}" controls></video></a>'; ?>`;
//             }
//             return `<?php echo '<a href="${ad.clickUrl}" target="_blank"><img src="${ad.mediaUrl}" width="${ad.width}" height="${ad.height}" alt="${ad.title}" /></a>'; ?>`;
//           }
//           if (platform === 'java') {
//             if (ad.mediaType === 'video') {
//               return `String adHtml = "<a href=\\"${ad.clickUrl}\\" target=\\"_blank\\"><video src=\\"${ad.mediaUrl}\\" width=\\"${ad.width}\\" height=\\"${ad.height}\\" controls></video></a>";`;
//             }
//             return `String adHtml = "<a href=\\"${ad.clickUrl}\\" target=\\"_blank\\"><img src=\\"${ad.mediaUrl}\\" width=\\"${ad.width}\\" height=\\"${ad.height}\\" alt=\\"${ad.title}\\" /></a>";`;
//           }
//           if (platform === 'flutter') {
//             if (ad.mediaType === 'video') {
//               return `GestureDetector(\n  onTap: () => launch('${ad.clickUrl}'),\n  child: Text('Video: ${ad.mediaUrl}'),\n)`;
//             }
//             return `GestureDetector(\n  onTap: () => launch('${ad.clickUrl}'),\n  child: Image.network('${ad.mediaUrl}', width: ${ad.width}, height: ${ad.height})\n)`;
//           }
//           if (platform === 'swift') {
//             if (ad.mediaType === 'video') {
//               return `let label = UILabel()\nlabel.text = "Video: ${ad.mediaUrl}"`;
//             }
//             return `let imageView = UIImageView()\nimageView.sd_setImage(with: URL(string: "${ad.mediaUrl}"))\nlet tapGesture = UITapGestureRecognizer(target: self, action: #selector(openURL))\nimageView.addGestureRecognizer(tapGesture)`;
//           }
//           if (platform === 'mobile') {
//             if (ad.mediaType === 'video') {
//               return `<a href="${ad.clickUrl}" target="_blank"><video src="${ad.mediaUrl}" width="100%" height="auto" controls style="max-width:${ad.width}px;"></video></a>`;
//             }
//             return `<a href="${ad.clickUrl}" target="_blank"><img src="${ad.mediaUrl}" width="100%" height="auto" alt="${ad.title}" style="max-width:${ad.width}px;" /></a>`;
//           }
//           if (ad.mediaType === 'video') {
//             return `<a href="${ad.clickUrl}" target="_blank"><video src="${ad.mediaUrl}" width="${ad.width}" height="${ad.height}" controls></video></a>`;
//           }
//           return `<a href="${ad.clickUrl}" target="_blank"><img src="${ad.mediaUrl}" width="${ad.width}" height="${ad.height}" alt="${ad.title}" /></a>`;
//         };

//         ad.embedCodes = {
//           web: embedFor('web'),
//           mobile: embedFor('mobile'),
//           react: embedFor('react'),
//           php: embedFor('php'),
//           java: embedFor('java'),
//           flutter: embedFor('flutter'),
//           swift: embedFor('swift')
//         };
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
//       const { device } = req.query;
      
//       if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
//         return res.status(400).json({ message: "Invalid Ad ID format" });
//       }

//       const updateField = device === 'mobile' ? 'analytics.mobileClicks' : 'analytics.webClicks';
//       const ad = await Ad.findByIdAndUpdate(id, { 
//         $inc: { 
//           'analytics.clicks': 1,
//           [updateField]: 1
//         }
//       }, { new: true });

//       if (!ad) {
//         return res.status(404).json({ message: "Ad not found" });
//       }

//       res.redirect(ad.clickUrl);
//     } catch (error) {
//       console.log("Error in trackClick:", error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   },

//   getAnalytics: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
      
//       if (!ad) {
//         return res.status(404).json({ message: "Ad not found" });
//       }

//       res.status(200).json({ 
//         analytics: ad.analytics,
//         title: ad.title,
//         isActive: ad.isActive
//       });
//     } catch (error) {
//       console.log('Error in getAnalytics:', error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   }
// };

// module.exports = AdController;




// ==================== AdController.js - FULLY COMPATIBLE WITH ARRAY MODEL ====================
// ✅ Handles mediaUrl as array
// ✅ Handles clickUrl as array (multiple tracking URLs)
// ✅ Smart ad fetching with real-life targeting (device, platform, geography, etc)
// ✅ Random ad selection from eligible ads (not just by ID)
// ✅ Proper analytics tracking

const Ad = require('./AdBanner');
const _getSmartAd = require('../Utils/getSmartAd');

const AdController = {
  // ==================== CREATE AD ====================
  createAd: async (req, res) => {
    try {
      const { title, width, height, mediaUrl: mediaUrlBody, mediaType: mediaTypeBody, clickUrl: clickUrlBody, targetDevices, targetPlatforms, schedule } = req.body;

      let mediaUrl = mediaUrlBody;
      let mediaType = mediaTypeBody;
      let clickUrl = clickUrlBody;

      // ✅ Handle file upload
      if (req.file) {
        const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        
        // ✅ Handle mediaUrl as array - push new URL
        if (Array.isArray(mediaUrl)) {
          mediaUrl.push(fileUrl);
        } else if (mediaUrl) {
          mediaUrl = [mediaUrl, fileUrl];
        } else {
          mediaUrl = [fileUrl];
        }

        // Auto-detect media type
        if (req.file.mimetype.startsWith('video/')) {
          mediaType = 'video';
        } else if (req.file.mimetype === 'image/gif') {
          mediaType = 'gif';
        } else if (req.file.mimetype.startsWith('image/')) {
          mediaType = 'image';
        }
      }

      // ✅ Validate required fields
      if (!title || !width || !height || !clickUrl || !mediaUrl) {
        return res.status(400).json({ message: "Title, width, height, mediaUrl (or file), and clickUrl are required" });
      }

      // ✅ Ensure mediaUrl is array
      if (!Array.isArray(mediaUrl)) {
        mediaUrl = [mediaUrl];
      }

      // ✅ Ensure clickUrl is array
      if (!Array.isArray(clickUrl)) {
        clickUrl = [clickUrl];
      }

      // Auto-detect media type if not provided
      if (!mediaType) {
        const urlToCheck = mediaUrl[0].toLowerCase();
        if (urlToCheck.endsWith('.mp4') || urlToCheck.endsWith('.webm') || urlToCheck.endsWith('.ogg')) {
          mediaType = 'video';
        } else if (urlToCheck.endsWith('.gif')) {
          mediaType = 'gif';
        } else {
          mediaType = 'image';
        }
      }

      // ✅ Generate embed codes with array support
      const embedFor = (platform) => {
        const primaryMediaUrl = mediaUrl[0];
        const primaryClickUrl = clickUrl[0]; // Primary redirect URL

        if (platform === 'react') {
          if (mediaType === 'video') {
            return `<a href="${primaryClickUrl}" target="_blank" rel="noopener noreferrer">\n  <video src="${primaryMediaUrl}" width={${width}} height={${height}} controls style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
          }
          return `<a href="${primaryClickUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${primaryMediaUrl}" width={${width}} height={${height}} alt="${title}" style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
        }
        if (platform === 'php') {
          if (mediaType === 'video') {
            return `<?php echo '<a href="${primaryClickUrl}" target="_blank"><video src="${primaryMediaUrl}" width="${width}" height="${height}" controls></video></a>'; ?>`;
          }
          return `<?php echo '<a href="${primaryClickUrl}" target="_blank"><img src="${primaryMediaUrl}" width="${width}" height="${height}" alt="${title}" /></a>'; ?>`;
        }
        if (platform === 'java') {
          if (mediaType === 'video') {
            return `String adHtml = "<a href=\\"${primaryClickUrl}\\" target=\\"_blank\\"><video src=\\"${primaryMediaUrl}\\" width=\\"${width}\\" height=\\"${height}\\" controls></video></a>";`;
          }
          return `String adHtml = "<a href=\\"${primaryClickUrl}\\" target=\\"_blank\\"><img src=\\"${primaryMediaUrl}\\" width=\\"${width}\\" height=\\"${height}\\" alt=\\"${title}\\" /></a>";`;
        }
        if (platform === 'flutter') {
          if (mediaType === 'video') {
            return `GestureDetector(\n  onTap: () => launch('${primaryClickUrl}'),\n  child: Text('Video: ${primaryMediaUrl}'),\n)`;
          }
          return `GestureDetector(\n  onTap: () => launch('${primaryClickUrl}'),\n  child: Image.network('${primaryMediaUrl}', width: ${width}, height: ${height})\n)`;
        }
        if (platform === 'swift') {
          if (mediaType === 'video') {
            return `let label = UILabel()\nlabel.text = "Video: ${primaryMediaUrl}"`;
          }
          return `let imageView = UIImageView()\nimageView.sd_setImage(with: URL(string: "${primaryMediaUrl}"))\nlet tapGesture = UITapGestureRecognizer(target: self, action: #selector(openURL))\nimageView.addGestureRecognizer(tapGesture)`;
        }
        if (platform === 'mobile') {
          if (mediaType === 'video') {
            return `<a href="${primaryClickUrl}" target="_blank"><video src="${primaryMediaUrl}" width="100%" height="auto" controls style="max-width:${width}px;"></video></a>`;
          }
          return `<a href="${primaryClickUrl}" target="_blank"><img src="${primaryMediaUrl}" width="100%" height="auto" alt="${title}" style="max-width:${width}px;" /></a>`;
        }
        if (mediaType === 'video') {
          return `<a href="${primaryClickUrl}" target="_blank"><video src="${primaryMediaUrl}" width="${width}" height="${height}" controls></video></a>`;
        }
        return `<a href="${primaryClickUrl}" target="_blank"><img src="${primaryMediaUrl}" width="${width}" height="${height}" alt="${title}" /></a>`;
      };

      const embedCodes = {
        web: embedFor('web'),
        mobile: embedFor('mobile'),
        react: embedFor('react'),
        php: embedFor('php'),
        java: embedFor('java'),
        flutter: embedFor('flutter'),
        swift: embedFor('swift')
      };

      const newAd = new Ad({
        title,
        width,
        height,
        mediaUrl,           // ✅ Array
        mediaType,
        clickUrl,           // ✅ Array
        createdBy: req.user.id,
        targetDevices: targetDevices || ['web', 'mobile'],
        targetPlatforms: targetPlatforms || ['html'],
        embedCodes,
        schedule: schedule || { isScheduled: false }
      });

      await newAd.save();
      console.log('✅ Ad created:', newAd._id);
      res.status(201).json({ message: "Ad created successfully", ad: newAd });
    } catch (error) {
      console.log('❌ Error in createAd:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==================== SMART AD FETCHING (Real-life scenario) ====================
  // Fetches eligible ads based on device, platform, geography, schedule, etc
  // NOT just by ID - selects random ad from eligible pool
  getAdByDevice: async (req, res) => {
    try {
      const { device = 'mobile', platform = 'flutter', country, city } = req.query;
      const { id } = req.params;

      console.log(`📍 Ad request: device=${device}, platform=${platform}, country=${country}, city=${city}`);

      // ✅ Case 1: Fetch by ID (for testing/debugging)
      if (id && id !== 'random') {
        return await AdController._fetchAdById(id, device, platform, res);
      }

      // ✅ Case 2: Smart ad matching (Real-life scenario)
      return await _getSmartAd(device, platform, country, city, res);

    } catch (error) {
      console.log("❌ Error in getAdByDevice:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==================== HELPER: Fetch specific ad by ID ====================
  _fetchAdById: async (id, device, platform, res) => {
    // Validate ID format
    if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: "Invalid Ad ID format" });
    }

    const ad = await Ad.findById(id);
    if (!ad || !ad.isActive) {
      return res.status(404).json({ message: "Ad not found or inactive" });
    }

    // Check device targeting
    if (device && !ad.targetDevices.includes(device)) {
      return res.status(400).json({ message: `Ad not available for ${device} devices` });
    }

    // Check platform targeting
    if (platform && !ad.targetPlatforms.includes(platform)) {
      return res.status(400).json({ message: `Ad not available for ${platform} platform` });
    }

    // Check schedule
    if (ad.schedule.isScheduled) {
      const now = new Date();
      if (ad.schedule.startDate && now < ad.schedule.startDate) {
        return res.status(400).json({ message: "Ad not yet active" });
      }
      if (ad.schedule.endDate && now > ad.schedule.endDate) {
        return res.status(400).json({ message: "Ad has expired" });
      }
    }

    // Select embed code
    let embedCode = ad.embedCodes.web;
    if (platform && ad.embedCodes[platform]) {
      embedCode = ad.embedCodes[platform];
    } else if (device === 'mobile') {
      embedCode = ad.embedCodes.mobile;
    }

    // Track impression
    const updateField = device === 'mobile' ? 'analytics.mobileImpressions' : 'analytics.webImpressions';
    await Ad.findByIdAndUpdate(id, {
      $inc: {
        'analytics.impressions': 1,
        [updateField]: 1
      }
    });

    console.log(`✅ Ad served by ID: ${ad._id}`);

    res.status(200).json({
      message: "Ad fetched successfully",
      ad: {
        ...ad.toObject(),
        embedCode,
        device,
        platform
      }
    });
  },



  // ==================== HELPER: Select ad by weighted random ====================
  _selectAdByWeightedRandom: (ads) => {
    // Strategy: Ads with better CTR (click-through rate) have higher probability
    const weights = ads.map(ad => {
      const impressions = ad.analytics.impressions || 1; // Avoid divide by zero
      const clicks = ad.analytics.clicks || 0;
      const ctr = clicks / impressions; // Click-through rate
      
      // Weight formula: (1 + ctr) so new ads (0 ctr) still get shown
      // Highly performing ads get exponential boost
      return {
        ad,
        weight: Math.max(0.5, 1 + (ctr * 10)) // Weight between 0.5 and 1+
      };
    });

    // Calculate total weight
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

    // Generate random number
    let random = Math.random() * totalWeight;

    // Select ad based on weight
    for (const w of weights) {
      random -= w.weight;
      if (random <= 0) {
        return w.ad;
      }
    }

    // Fallback (shouldn't reach here)
    return ads[Math.floor(Math.random() * ads.length)];
  },

  // ==================== UPDATE AD ====================
  updateAd: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, width, height, mediaUrl: mediaUrlBody, mediaType: mediaTypeBody, clickUrl: clickUrlBody, isActive, targetDevices, targetPlatforms, schedule } = req.body;

      const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      let mediaUrl = mediaUrlBody;
      let mediaType = mediaTypeBody;
      let clickUrl = clickUrlBody;

      // Handle file upload
      if (req.file) {
        const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        
        // ✅ Handle mediaUrl as array
        if (Array.isArray(mediaUrl)) {
          mediaUrl.push(fileUrl);
        } else if (mediaUrl) {
          mediaUrl = [mediaUrl, fileUrl];
        } else {
          mediaUrl = [fileUrl];
        }

        if (req.file.mimetype.startsWith('video/')) {
          mediaType = 'video';
        } else if (req.file.mimetype === 'image/gif') {
          mediaType = 'gif';
        } else if (req.file.mimetype.startsWith('image/')) {
          mediaType = 'image';
        }
      }

      // Update fields
      if (title) ad.title = title;
      if (width) ad.width = width;
      if (height) ad.height = height;
      if (mediaUrl) {
        // ✅ Ensure mediaUrl is array
        ad.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
      }
      if (mediaType) ad.mediaType = mediaType;
      if (clickUrl) {
        // ✅ Ensure clickUrl is array
        ad.clickUrl = Array.isArray(clickUrl) ? clickUrl : [clickUrl];
      }
      if (typeof isActive === 'boolean') ad.isActive = isActive;
      if (targetDevices) ad.targetDevices = targetDevices;
      if (targetPlatforms) ad.targetPlatforms = targetPlatforms;
      if (schedule) ad.schedule = { ...ad.schedule, ...schedule };

      // Auto-detect media type if not provided
      if (!ad.mediaType && ad.mediaUrl && ad.mediaUrl.length > 0) {
        const urlToCheck = ad.mediaUrl[0].toLowerCase();
        if (urlToCheck.endsWith('.mp4') || urlToCheck.endsWith('.webm') || urlToCheck.endsWith('.ogg')) {
          ad.mediaType = 'video';
        } else if (urlToCheck.endsWith('.gif')) {
          ad.mediaType = 'gif';
        } else {
          ad.mediaType = 'image';
        }
      }

      // Regenerate embed codes if content changed
      if (title || width || height || mediaUrl || mediaType || clickUrl) {
        const embedFor = (platform) => {
          const primaryMediaUrl = ad.mediaUrl[0];
          const primaryClickUrl = ad.clickUrl[0];

          if (platform === 'react') {
            if (ad.mediaType === 'video') {
              return `<a href="${primaryClickUrl}" target="_blank" rel="noopener noreferrer">\n  <video src="${primaryMediaUrl}" width={${ad.width}} height={${ad.height}} controls style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
            }
            return `<a href="${primaryClickUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${primaryMediaUrl}" width={${ad.width}} height={${ad.height}} alt="${ad.title}" style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
          }
          if (platform === 'php') {
            if (ad.mediaType === 'video') {
              return `<?php echo '<a href="${primaryClickUrl}" target="_blank"><video src="${primaryMediaUrl}" width="${ad.width}" height="${ad.height}" controls></video></a>'; ?>`;
            }
            return `<?php echo '<a href="${primaryClickUrl}" target="_blank"><img src="${primaryMediaUrl}" width="${ad.width}" height="${ad.height}" alt="${ad.title}" /></a>'; ?>`;
          }
          if (platform === 'java') {
            if (ad.mediaType === 'video') {
              return `String adHtml = "<a href=\\"${primaryClickUrl}\\" target=\\"_blank\\"><video src=\\"${primaryMediaUrl}\\" width=\\"${ad.width}\\" height=\\"${ad.height}\\" controls></video></a>";`;
            }
            return `String adHtml = "<a href=\\"${primaryClickUrl}\\" target=\\"_blank\\"><img src=\\"${primaryMediaUrl}\\" width=\\"${ad.width}\\" height=\\"${ad.height}\\" alt=\\"${ad.title}\\" /></a>";`;
          }
          if (platform === 'flutter') {
            if (ad.mediaType === 'video') {
              return `GestureDetector(\n  onTap: () => launch('${primaryClickUrl}'),\n  child: Text('Video: ${primaryMediaUrl}'),\n)`;
            }
            return `GestureDetector(\n  onTap: () => launch('${primaryClickUrl}'),\n  child: Image.network('${primaryMediaUrl}', width: ${ad.width}, height: ${ad.height})\n)`;
          }
          if (platform === 'swift') {
            if (ad.mediaType === 'video') {
              return `let label = UILabel()\nlabel.text = "Video: ${primaryMediaUrl}"`;
            }
            return `let imageView = UIImageView()\nimageView.sd_setImage(with: URL(string: "${primaryMediaUrl}"))\nlet tapGesture = UITapGestureRecognizer(target: self, action: #selector(openURL))\nimageView.addGestureRecognizer(tapGesture)`;
          }
          if (platform === 'mobile') {
            if (ad.mediaType === 'video') {
              return `<a href="${primaryClickUrl}" target="_blank"><video src="${primaryMediaUrl}" width="100%" height="auto" controls style="max-width:${ad.width}px;"></video></a>`;
            }
            return `<a href="${primaryClickUrl}" target="_blank"><img src="${primaryMediaUrl}" width="100%" height="auto" alt="${ad.title}" style="max-width:${ad.width}px;" /></a>`;
          }
          if (ad.mediaType === 'video') {
            return `<a href="${primaryClickUrl}" target="_blank"><video src="${primaryMediaUrl}" width="${ad.width}" height="${ad.height}" controls></video></a>`;
          }
          return `<a href="${primaryClickUrl}" target="_blank"><img src="${primaryMediaUrl}" width="${ad.width}" height="${ad.height}" alt="${ad.title}" /></a>`;
        };

        ad.embedCodes = {
          web: embedFor('web'),
          mobile: embedFor('mobile'),
          react: embedFor('react'),
          php: embedFor('php'),
          java: embedFor('java'),
          flutter: embedFor('flutter'),
          swift: embedFor('swift')
        };
      }

      await ad.save();
      console.log('✅ Ad updated:', ad._id);
      res.status(200).json({ message: "Ad updated successfully", ad });
    } catch (error) {
      console.log('❌ Error in updateAd:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==================== DELETE AD ====================
  deleteAd: async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await Ad.findOneAndDelete({ _id: id, createdBy: req.user.id });
      
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      console.log('✅ Ad deleted:', ad._id);
      res.status(200).json({ message: "Ad deleted successfully" });
    } catch (error) {
      console.log('❌ Error in deleteAd:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==================== TRACK CLICK (Array support) ====================
  trackClick: async (req, res) => {
    try {
      const { id } = req.params;
      const { device } = req.query;
      
      if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ message: "Invalid Ad ID format" });
      }

      const updateField = device === 'mobile' ? 'analytics.mobileClicks' : 'analytics.webClicks';
      const ad = await Ad.findByIdAndUpdate(id, { 
        $inc: { 
          'analytics.clicks': 1,
          [updateField]: 1
        }
      }, { new: true });

      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      // ✅ Return all click URLs for multi-tracking
      console.log(`✅ Click tracked for ad ${ad._id}`);

      res.status(200).json({
        message: "Click tracked successfully",
        clickUrls: ad.clickUrl,      // ✅ All URLs (tracking + main)
        primaryUrl: ad.clickUrl[0],  // ✅ First is main redirect
        trackingUrls: ad.clickUrl.slice(1) // ✅ Rest are tracking pixels
      });

      // Optional: Redirect to primary URL
      // res.redirect(ad.clickUrl[0]);

    } catch (error) {
      console.log("❌ Error in trackClick:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==================== GET ANALYTICS ====================
  getAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
      
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      // Calculate CTR
      const impressions = ad.analytics.impressions || 0;
      const clicks = ad.analytics.clicks || 0;
      const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0;

      console.log(`📊 Analytics for ad ${ad._id}: impressions=${impressions}, clicks=${clicks}, ctr=${ctr}%`);

      res.status(200).json({ 
        analytics: ad.analytics,
        title: ad.title,
        isActive: ad.isActive,
        ctr: `${ctr}%`,
        device: {
          mobileImpressions: ad.analytics.mobileImpressions,
          mobileClicks: ad.analytics.mobileClicks,
          mobileCtr: ad.analytics.mobileImpressions > 0 
            ? ((ad.analytics.mobileClicks / ad.analytics.mobileImpressions) * 100).toFixed(2) + '%'
            : '0%',
          webImpressions: ad.analytics.webImpressions,
          webClicks: ad.analytics.webClicks,
          webCtr: ad.analytics.webImpressions > 0 
            ? ((ad.analytics.webClicks / ad.analytics.webImpressions) * 100).toFixed(2) + '%'
            : '0%'
        }
      });
    } catch (error) {
      console.log('❌ Error in getAnalytics:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // ==================== GET ALL ADS (with filtering) ====================
  getAds: async (req, res) => {
    try {
      const { device, platform } = req.query;
      let filter = { createdBy: req.user.id };

      if (device) filter.targetDevices = device;
      if (platform) filter.targetPlatforms = platform;

      const ads = await Ad.find(filter).populate('createdBy', 'username email');
      
      console.log(`✅ Fetched ${ads.length} ads for user`);

      res.status(200).json({ ads });
    } catch (error) {
      console.log('❌ Error in getAds:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = AdController;