const Ad = require('./AdBanner');

const AdController = {
  createAd: async (req, res) => {
    try {
      // console.log(req.body);
      const { title, width, height, mediaUrl, mediaType, clickUrl, targetDevices, targetPlatforms, schedule, category } = req.body;

      if (!title || !width || !height || !mediaUrl || !clickUrl || !mediaType || !category) {
        return res.status(400).json({ message: "Title, width, height, mediaUrl, mediaType, and clickUrl are required" });
      }

      const embedCodes = {
        web: `<a href="${clickUrl}" target="_blank"><img src="${mediaUrl}" width="${width}" height="${height}" alt="${title}" /></a>`,
        mobile: `<a href="${clickUrl}" target="_blank"><img src="${mediaUrl}" width="100%" height="auto" alt="${title}" style="max-width:${width}px;" /></a>`,
        react: `<a href="${clickUrl}" target="_blank" rel="noopener noreferrer">\n <img src="${mediaUrl}" width={${width}} height={${height}} alt="${title}" style={{maxWidth: '100%', height: 'auto'}} />\n</a>`,
        php: `<?php echo '<a href="${clickUrl}" target="_blank"><img src="${mediaUrl}" width="${width}" height="${height}" alt="${title}" /></a>'; ?>`,
        java: `String adHtml = "<a href=\\"${clickUrl}\\" target=\\"_blank\\"><img src=\\"${mediaUrl}\\" width=\\"${width}\\" height=\\"${height}\\" alt=\\"${title}\\" /></a>";`,
        flutter: `GestureDetector(\n onTap: () => launch('${clickUrl}'),\n child: Image.network('${mediaUrl}', width: ${width}, height: ${height})\n)`,
        swift: `let imageView = UIImageView()\nimageView.sd_setImage(with: URL(string: "${mediaUrl}"))\nlet tapGesture = UITapGestureRecognizer(target: self, action: #selector(openURL))\nimageView.addGestureRecognizer(tapGesture)`
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
        schedule: schedule || { isScheduled: false },
        category
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

      if (device && !ad.targetDevices.includes(device)) {
        return res.status(400).json({ message: `Ad not available for ${device} devices` });
      }
      if (platform && !ad.targetPlatforms.includes(platform)) {
        return res.status(400).json({ message: `Ad not available for ${platform} platform` });
      }

      if (ad.schedule.isScheduled) {
        const now = new Date();
        if (ad.schedule.startDate && now < ad.schedule.startDate) {
          return res.status(400).json({ message: "Ad not yet active" });
        }
        if (ad.schedule.endDate && now > ad.schedule.endDate) {
          return res.status(400).json({ message: "Ad has expired" });
        }
      }

      let embedCode = ad.embedCodes.web;
      if (platform && ad.embedCodes[platform]) {
        embedCode = ad.embedCodes[platform];
      } else if (device === 'mobile') {
        embedCode = ad.embedCodes.mobile;
      }

      const updateField = device === 'mobile' ? 'analytics.mobileImpressions' : 'analytics.webImpressions';
      await Ad.findByIdAndUpdate(id, {
        $inc: {
          'analytics.impressions': 1,
          [updateField]: 1
        }
      });

      res.status(200).json({
        message: "Ad fetched successfully",
        ad: {
          ...ad.toObject(),
          embedCode,
          device: device || 'web',
          platform: platform || 'html'
        }
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
      const { title, width, height, mediaUrl, mediaType, clickUrl, isActive, targetDevices, targetPlatforms, schedule } = req.body;

      const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
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

      if (title || width || height || mediaUrl || mediaType || clickUrl) {
        ad.embedCodes = {
          web: `<a href="${ad.clickUrl}" target="_blank"><img src="${ad.mediaUrl}" width="${ad.width}" height="${ad.height}" alt="${ad.title}" /></a>`,
          mobile: `<a href="${ad.clickUrl}" target="_blank"><img src="${ad.mediaUrl}" width="100%" height="auto" alt="${ad.title}" style="max-width:${ad.width}px;" /></a>`,
          react: `<a href="${ad.clickUrl}" target="_blank" rel="noopener noreferrer">\n <img src="${ad.mediaUrl}" width={${ad.width}} height={${ad.height}} alt="${ad.title}" style={{maxWidth: '100%', height: 'auto'}} />\n</a>`,
          php: `<?php echo '<a href="${ad.clickUrl}" target="_blank"><img src="${ad.mediaUrl}" width="${ad.width}" height="${ad.height}" alt="${ad.title}" /></a>'; ?>`,
          java: `String adHtml = "<a href=\\"${ad.clickUrl}\\" target=\\"_blank\\"><img src=\\"${ad.mediaUrl}\\" width=\\"${ad.width}\\" height=\\"${ad.height}\\" alt=\\"${ad.title}\\" /></a>";`,
          flutter: `GestureDetector(\n onTap: () => launch('${ad.clickUrl}'),\n child: Image.network('${ad.mediaUrl}', width: ${ad.width}, height: ${ad.height})\n)`,
          swift: `let imageView = UIImageView()\nimageView.sd_setImage(with: URL(string: "${ad.mediaUrl}"))\nlet tapGesture = UITapGestureRecognizer(target: self, action: #selector(openURL))\nimageView.addGestureRecognizer(tapGesture)`
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
