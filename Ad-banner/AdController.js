const Ad = require('./AdBanner');

const AdController = {
  createAd: async (req, res) => {
    try {
      const { title, width, height, mediaUrl: mediaUrlBody, mediaType: mediaTypeBody, clickUrl, targetDevices, targetPlatforms, schedule } = req.body;

      let mediaUrl = mediaUrlBody;
      let mediaType = mediaTypeBody;

      if (req.file) {
        const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        mediaUrl = fileUrl;
        if (req.file.mimetype.startsWith('video/')) {
          mediaType = 'video';
        } else if (req.file.mimetype === 'image/gif') {
          mediaType = 'gif';
        } else if (req.file.mimetype.startsWith('image/')) {
          mediaType = 'image';
        }
      }

      if (!title || !width || !height || !clickUrl || !mediaUrl) {
        return res.status(400).json({ message: "Title, width, height, mediaUrl (or file), and clickUrl are required" });
      }

      if (!mediaType) {
        if (mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.toLowerCase().endsWith('.webm') || mediaUrl.toLowerCase().endsWith('.ogg')) {
          mediaType = 'video';
        } else if (mediaUrl.toLowerCase().endsWith('.gif')) {
          mediaType = 'gif';
        } else {
          mediaType = 'image';
        }
      }

      const embedFor = (platform) => {
        if (platform === 'react') {
          if (mediaType === 'video') {
            return `<a href="${clickUrl}" target="_blank" rel="noopener noreferrer">\n  <video src="${mediaUrl}" width={${width}} height={${height}} controls style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
          }
          return `<a href="${clickUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${mediaUrl}" width={${width}} height={${height}} alt="${title}" style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
        }
        if (platform === 'php') {
          if (mediaType === 'video') {
            return `<?php echo '<a href="${clickUrl}" target="_blank"><video src="${mediaUrl}" width="${width}" height="${height}" controls></video></a>'; ?>`;
          }
          return `<?php echo '<a href="${clickUrl}" target="_blank"><img src="${mediaUrl}" width="${width}" height="${height}" alt="${title}" /></a>'; ?>`;
        }
        if (platform === 'java') {
          if (mediaType === 'video') {
            return `String adHtml = "<a href=\\"${clickUrl}\\" target=\\"_blank\\"><video src=\\"${mediaUrl}\\" width=\\"${width}\\" height=\\"${height}\\" controls></video></a>";`;
          }
          return `String adHtml = "<a href=\\"${clickUrl}\\" target=\\"_blank\\"><img src=\\"${mediaUrl}\\" width=\\"${width}\\" height=\\"${height}\\" alt=\\"${title}\\" /></a>";`;
        }
        if (platform === 'flutter') {
          if (mediaType === 'video') {
            return `GestureDetector(\n  onTap: () => launch('${clickUrl}'),\n  child: Text('Video: ${mediaUrl}'),\n)`;
          }
          return `GestureDetector(\n  onTap: () => launch('${clickUrl}'),\n  child: Image.network('${mediaUrl}', width: ${width}, height: ${height})\n)`;
        }
        if (platform === 'swift') {
          if (mediaType === 'video') {
            return `let label = UILabel()\nlabel.text = "Video: ${mediaUrl}"`;
          }
          return `let imageView = UIImageView()\nimageView.sd_setImage(with: URL(string: "${mediaUrl}"))\nlet tapGesture = UITapGestureRecognizer(target: self, action: #selector(openURL))\nimageView.addGestureRecognizer(tapGesture)`;
        }
        if (platform === 'mobile') {
          if (mediaType === 'video') {
            return `<a href="${clickUrl}" target="_blank"><video src="${mediaUrl}" width="100%" height="auto" controls style="max-width:${width}px;"></video></a>`;
          }
          return `<a href="${clickUrl}" target="_blank"><img src="${mediaUrl}" width="100%" height="auto" alt="${title}" style="max-width:${width}px;" /></a>`;
        }
        if (mediaType === 'video') {
          return `<a href="${clickUrl}" target="_blank"><video src="${mediaUrl}" width="${width}" height="${height}" controls></video></a>`;
        }
        return `<a href="${clickUrl}" target="_blank"><img src="${mediaUrl}" width="${width}" height="${height}" alt="${title}" /></a>`;
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
        mediaUrl,
        mediaType,
        clickUrl,
        createdBy: req.user.id,
        targetDevices: targetDevices || ['web', 'mobile'],
        targetPlatforms: targetPlatforms || ['html'],
        embedCodes,
        schedule: schedule || { isScheduled: false }
      });

      await newAd.save();
      res.status(201).json({ message: "Ad created successfully", ad: newAd });
    } catch (error) {
      console.log('Error in createAd:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAdByDevice: async (req, res) => {
    try {
      const { device, platform } = req.query;
      const { id } = req.params;
      
      if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ message: "Invalid Ad ID format" });
      }

      const ad = await Ad.findById(id);
      if (!ad || !ad.isActive) {
        return res.status(404).json({ message: "Ad not found or inactive" });
      }

      // Check if ad supports the requested device
      if (device && !ad.targetDevices.includes(device)) {
        return res.status(400).json({ message: `Ad not available for ${device} devices` });
      }

      // Check if ad supports the requested platform
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

      let embedCode = ad.embedCodes.web; // default
      
      if (platform && ad.embedCodes[platform]) {
        embedCode = ad.embedCodes[platform];
      } else if (device === 'mobile') {
        embedCode = ad.embedCodes.mobile;
      }

      // Track impression by device
      const updateField = device === 'mobile' ? 'analytics.mobileImpressions' : 'analytics.webImpressions';
      await Ad.findByIdAndUpdate(id, { 
        $inc: { 
          'analytics.impressions': 1,
          [updateField]: 1
        }
      });

      res.status(200).json({
        embedCode,
        device: device || 'web',
        platform: platform || 'html',
        adId: id,
        title: ad.title
      });
    } catch (error) {
      console.log('Error in getAdByDevice:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAds: async (req, res) => {
    try {
      const { device, platform } = req.query;
      let filter = { createdBy: req.user.id };

      if (device) filter.targetDevices = device;
      if (platform) filter.targetPlatforms = platform;

      const ads = await Ad.find(filter).populate('createdBy', 'username email');
      res.status(200).json({ ads });
    } catch (error) {
      console.log('Error in getAds:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateAd: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, width, height, mediaUrl: mediaUrlBody, mediaType: mediaTypeBody, clickUrl, isActive, targetDevices, targetPlatforms, schedule } = req.body;

      const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      let mediaUrl = mediaUrlBody;
      let mediaType = mediaTypeBody;

      if (req.file) {
        const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        mediaUrl = fileUrl;
        if (req.file.mimetype.startsWith('video/')) {
          mediaType = 'video';
        } else if (req.file.mimetype === 'image/gif') {
          mediaType = 'gif';
        } else if (req.file.mimetype.startsWith('image/')) {
          mediaType = 'image';
        }
      }

      if (title) ad.title = title;
      if (width) ad.width = width;
      if (height) ad.height = height;
      if (mediaUrl) ad.mediaUrl = mediaUrl;
      if (mediaType) ad.mediaType = mediaType;
      if (clickUrl) ad.clickUrl = clickUrl;
      if (typeof isActive === 'boolean') ad.isActive = isActive;
      if (targetDevices) ad.targetDevices = targetDevices;
      if (targetPlatforms) ad.targetPlatforms = targetPlatforms;
      if (schedule) ad.schedule = { ...ad.schedule, ...schedule };

      if (!ad.mediaType) {
        if ((ad.mediaUrl || '').toLowerCase().endsWith('.mp4') || (ad.mediaUrl || '').toLowerCase().endsWith('.webm') || (ad.mediaUrl || '').toLowerCase().endsWith('.ogg')) {
          ad.mediaType = 'video';
        } else if ((ad.mediaUrl || '').toLowerCase().endsWith('.gif')) {
          ad.mediaType = 'gif';
        } else {
          ad.mediaType = 'image';
        }
      }

      // Regenerate embed codes if content changed
      if (title || width || height || mediaUrl || mediaType || clickUrl) {
        const embedFor = (platform) => {
          if (platform === 'react') {
            if (ad.mediaType === 'video') {
              return `<a href="${ad.clickUrl}" target="_blank" rel="noopener noreferrer">\n  <video src="${ad.mediaUrl}" width={${ad.width}} height={${ad.height}} controls style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
            }
            return `<a href="${ad.clickUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${ad.mediaUrl}" width={${ad.width}} height={${ad.height}} alt="${ad.title}" style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
          }
          if (platform === 'php') {
            if (ad.mediaType === 'video') {
              return `<?php echo '<a href="${ad.clickUrl}" target="_blank"><video src="${ad.mediaUrl}" width="${ad.width}" height="${ad.height}" controls></video></a>'; ?>`;
            }
            return `<?php echo '<a href="${ad.clickUrl}" target="_blank"><img src="${ad.mediaUrl}" width="${ad.width}" height="${ad.height}" alt="${ad.title}" /></a>'; ?>`;
          }
          if (platform === 'java') {
            if (ad.mediaType === 'video') {
              return `String adHtml = "<a href=\\"${ad.clickUrl}\\" target=\\"_blank\\"><video src=\\"${ad.mediaUrl}\\" width=\\"${ad.width}\\" height=\\"${ad.height}\\" controls></video></a>";`;
            }
            return `String adHtml = "<a href=\\"${ad.clickUrl}\\" target=\\"_blank\\"><img src=\\"${ad.mediaUrl}\\" width=\\"${ad.width}\\" height=\\"${ad.height}\\" alt=\\"${ad.title}\\" /></a>";`;
          }
          if (platform === 'flutter') {
            if (ad.mediaType === 'video') {
              return `GestureDetector(\n  onTap: () => launch('${ad.clickUrl}'),\n  child: Text('Video: ${ad.mediaUrl}'),\n)`;
            }
            return `GestureDetector(\n  onTap: () => launch('${ad.clickUrl}'),\n  child: Image.network('${ad.mediaUrl}', width: ${ad.width}, height: ${ad.height})\n)`;
          }
          if (platform === 'swift') {
            if (ad.mediaType === 'video') {
              return `let label = UILabel()\nlabel.text = "Video: ${ad.mediaUrl}"`;
            }
            return `let imageView = UIImageView()\nimageView.sd_setImage(with: URL(string: "${ad.mediaUrl}"))\nlet tapGesture = UITapGestureRecognizer(target: self, action: #selector(openURL))\nimageView.addGestureRecognizer(tapGesture)`;
          }
          if (platform === 'mobile') {
            if (ad.mediaType === 'video') {
              return `<a href="${ad.clickUrl}" target="_blank"><video src="${ad.mediaUrl}" width="100%" height="auto" controls style="max-width:${ad.width}px;"></video></a>`;
            }
            return `<a href="${ad.clickUrl}" target="_blank"><img src="${ad.mediaUrl}" width="100%" height="auto" alt="${ad.title}" style="max-width:${ad.width}px;" /></a>`;
          }
          if (ad.mediaType === 'video') {
            return `<a href="${ad.clickUrl}" target="_blank"><video src="${ad.mediaUrl}" width="${ad.width}" height="${ad.height}" controls></video></a>`;
          }
          return `<a href="${ad.clickUrl}" target="_blank"><img src="${ad.mediaUrl}" width="${ad.width}" height="${ad.height}" alt="${ad.title}" /></a>`;
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
      res.status(200).json({ message: "Ad updated successfully", ad });
    } catch (error) {
      console.log('Error in updateAd:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteAd: async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await Ad.findOneAndDelete({ _id: id, createdBy: req.user.id });
      
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      res.status(200).json({ message: "Ad deleted successfully" });
    } catch (error) {
      console.log('Error in deleteAd:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

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

      res.redirect(ad.clickUrl);
    } catch (error) {
      console.log("Error in trackClick:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
      
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      res.status(200).json({ 
        analytics: ad.analytics,
        title: ad.title,
        isActive: ad.isActive
      });
    } catch (error) {
      console.log('Error in getAnalytics:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = AdController;