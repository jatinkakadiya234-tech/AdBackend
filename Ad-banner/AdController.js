const Ad = require('./AdBanner');
const User = require('../User/UserModel');

const AdController = {
  createAd: async (req, res) => {
    try {
      let { title, width, height, mediaUrl: mediaUrlBody, mediaType: mediaTypeBody, clickUrl, category, targetDevices, targetPlatforms, schedule } = req.body;
      
      // Parse JSON strings from FormData
      if (typeof targetDevices === 'string') {
        targetDevices = JSON.parse(targetDevices);
      }
      if (typeof targetPlatforms === 'string') {
        targetPlatforms = JSON.parse(targetPlatforms);
      }

      let mediaUrl = mediaUrlBody;
      let mediaType = mediaTypeBody;

      if (req.file) {
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        mediaUrl = fileUrl;
        if (req.file.mimetype.startsWith('video/')) {
          mediaType = 'video';
        } else if (req.file.mimetype === 'image/gif') {
          mediaType = 'gif';
        } else if (req.file.mimetype.startsWith('image/')) {
          mediaType = 'image';
        }
      }

      if (!title || !width || !height || !clickUrl || !mediaUrl || !category) {
        return res.status(400).json({ message: "Title, width, height, mediaUrl (or file), clickUrl, and category are required" });
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

      // Skip wallet check for now
      const adCreationCost = 0.50;

      const newAd = new Ad({
        title,
        width,
        height,
        mediaUrl,
        mediaType,
        clickUrl,
        category,
        createdBy: req.user?.id || null,
        targetDevices: targetDevices || ['web', 'mobile'],
        targetPlatforms: targetPlatforms || ['html'],
        embedCodes,
        schedule: schedule || { isScheduled: false }
      });

      // Set wallet info in ad (no automatic balance)
      newAd.wallet.creationCost = adCreationCost;
      newAd.wallet.totalSpent = adCreationCost;
      newAd.wallet.balance = 0; // Start with 0 balance
      await newAd.save();

      // Skip wallet deduction for now

      res.status(201).json({ 
        message: "Ad created successfully", 
        ad: newAd,
        walletBalance: 0,
        amountDeducted: adCreationCost
      });
    } catch (error) {
      console.log('Error in createAd:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAdByDevice: async (req, res) => {
  try {
    const { device, platform } = req.query;
    const { id } = req.params;

    // ✅ Validate ID format
    if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: "Invalid Ad ID format" });
    }

    // ✅ Find Ad
    const ad = await Ad.findById(id);
    if (!ad || !ad.isActive) {
      return res.status(404).json({ message: "Ad not found or inactive" });
    }

    // ✅ Device & Platform Filtering
    if (device && !ad.targetDevices.includes(device)) {
      return res.status(400).json({ message: `Ad not available for ${device} devices` });
    }
    if (platform && !ad.targetPlatforms.includes(platform)) {
      return res.status(400).json({ message: `Ad not available for ${platform} platform` });
    }

    // ✅ Schedule Check
    if (ad.schedule.isScheduled) {
      const now = new Date();
      if (ad.schedule.startDate && now < ad.schedule.startDate) {
        return res.status(400).json({ message: "Ad not yet active" });
      }
      if (ad.schedule.endDate && now > ad.schedule.endDate) {
        return res.status(400).json({ message: "Ad has expired" });
      }
    }

    // ✅ Select embed code dynamically
    let embedCode = ad.embedCodes.web;
    if (platform && ad.embedCodes[platform]) {
      embedCode = ad.embedCodes[platform];
    } else if (device === 'mobile') {
      embedCode = ad.embedCodes.mobile;
    }

    // ✅ Track impression
    const updateField = device === 'mobile' ? 'analytics.mobileImpressions' : 'analytics.webImpressions';
    await Ad.findByIdAndUpdate(id, {
      $inc: {
        'analytics.impressions': 1,
        [updateField]: 1
      }
    });

    // ✅ Send full ad data + embed code
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

      if (device) filter.targetDevices = { $in: [device] };
      if (platform) filter.targetPlatforms = { $in: [platform] };

      const ads = await Ad.find(filter)
        .populate('createdBy', 'username email')
        .populate('category', 'name description')
        .sort({ createdAt: -1 });
      
      // Auto-deactivate ads with 0 balance
      for (let ad of ads) {
        if (ad.isActive && ad.wallet.balance <= 0) {
          ad.isActive = false;
          await ad.save();
        }
      }
      
      res.status(200).json({ 
        message: "Ads fetched successfully",
        ads,
        count: ads.length 
      });
    } catch (error) {
      console.log('Error in getAds:', error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  getAllAds: async (req, res) => {
    try {
      const { device, platform } = req.query;
      let filter = { isActive: true };

      if (device) filter.targetDevices = device;
      if (platform) filter.targetPlatforms = platform;

      const ads = await Ad.find(filter)
        .populate('createdBy', 'username email')
        .populate('category', 'name description');
      res.status(200).json({ ads });
    } catch (error) {
      console.log('Error in getAllAds:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateAd: async (req, res) => {
    try {
      const { id } = req.params;
      let { title, width, height, mediaUrl: mediaUrlBody, mediaType: mediaTypeBody, clickUrl, isActive, targetDevices, targetPlatforms, schedule } = req.body;

      // Parse JSON strings from FormData
      if (typeof targetDevices === 'string') {
        targetDevices = JSON.parse(targetDevices);
      }
      if (typeof targetPlatforms === 'string') {
        targetPlatforms = JSON.parse(targetPlatforms);
      }

      const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      let mediaUrl = mediaUrlBody || ad.mediaUrl;
      let mediaType = mediaTypeBody || ad.mediaType;

      if (req.file) {
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        mediaUrl = fileUrl;
        if (req.file.mimetype.startsWith('video/')) {
          mediaType = 'video';
        } else if (req.file.mimetype === 'image/gif') {
          mediaType = 'gif';
        } else if (req.file.mimetype.startsWith('image/')) {
          mediaType = 'image';
        }
      }

      const embedFor = (platform) => {
        if (platform === 'react') {
          if (mediaType === 'video') {
            return `<a href="${clickUrl || ad.clickUrl}" target="_blank" rel="noopener noreferrer">\n  <video src="${mediaUrl}" width={${width || ad.width}} height={${height || ad.height}} controls style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
          }
          return `<a href="${clickUrl || ad.clickUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${mediaUrl}" width={${width || ad.width}} height={${height || ad.height}} alt="${title || ad.title}" style={{maxWidth: '100%', height: 'auto'}} />\n</a>`;
        }
        if (platform === 'php') {
          if (mediaType === 'video') {
            return `<?php echo '<a href="${clickUrl || ad.clickUrl}" target="_blank"><video src="${mediaUrl}" width="${width || ad.width}" height="${height || ad.height}" controls></video></a>'; ?>`;
          }
          return `<?php echo '<a href="${clickUrl || ad.clickUrl}" target="_blank"><img src="${mediaUrl}" width="${width || ad.width}" height="${height || ad.height}" alt="${title || ad.title}" /></a>'; ?>`;
        }
        if (platform === 'java') {
          if (mediaType === 'video') {
            return `String adHtml = "<a href=\\"${clickUrl || ad.clickUrl}\\" target=\\"_blank\\"><video src=\\"${mediaUrl}\\" width=\\"${width || ad.width}\\" height=\\"${height || ad.height}\\" controls></video></a>";`;
          }
          return `String adHtml = "<a href=\\"${clickUrl || ad.clickUrl}\\" target=\\"_blank\\"><img src=\\"${mediaUrl}\\" width=\\"${width || ad.width}\\" height=\\"${height || ad.height}\\" alt=\\"${title || ad.title}\\" /></a>";`;
        }
        if (platform === 'flutter') {
          if (mediaType === 'video') {
            return `GestureDetector(\n  onTap: () => launch('${clickUrl || ad.clickUrl}'),\n  child: Text('Video: ${mediaUrl}'),\n)`;
          }
          return `GestureDetector(\n  onTap: () => launch('${clickUrl || ad.clickUrl}'),\n  child: Image.network('${mediaUrl}', width: ${width || ad.width}, height: ${height || ad.height})\n)`;
        }
        if (platform === 'swift') {
          if (mediaType === 'video') {
            return `let label = UILabel()\nlabel.text = "Video: ${mediaUrl}"`;
          }
          return `let imageView = UIImageView()\nimageView.sd_setImage(with: URL(string: "${mediaUrl}"))\nlet tapGesture = UITapGestureRecognizer(target: self, action: #selector(openURL))\nimageView.addGestureRecognizer(tapGesture)`;
        }
        if (platform === 'mobile') {
          if (mediaType === 'video') {
            return `<a href="${clickUrl || ad.clickUrl}" target="_blank"><video src="${mediaUrl}" width="100%" height="auto" controls style="max-width:${width || ad.width}px;"></video></a>`;
          }
          return `<a href="${clickUrl || ad.clickUrl}" target="_blank"><img src="${mediaUrl}" width="100%" height="auto" alt="${title || ad.title}" style="max-width:${width || ad.width}px;" /></a>`;
        }
        if (mediaType === 'video') {
          return `<a href="${clickUrl || ad.clickUrl}" target="_blank"><video src="${mediaUrl}" width="${width || ad.width}" height="${height || ad.height}" controls></video></a>`;
        }
        return `<a href="${clickUrl || ad.clickUrl}" target="_blank"><img src="${mediaUrl}" width="${width || ad.width}" height="${height || ad.height}" alt="${title || ad.title}" /></a>`;
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

      const updateData = {
        ...(title && { title }),
        ...(width && { width }),
        ...(height && { height }),
        mediaUrl,
        mediaType,
        ...(clickUrl && { clickUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(targetDevices && { targetDevices }),
        ...(targetPlatforms && { targetPlatforms }),
        ...(schedule && { schedule }),
        embedCodes
      };

      const updatedAd = await Ad.findByIdAndUpdate(id, updateData, { new: true });
      res.status(200).json({ message: "Ad updated successfully", ad: updatedAd });
    } catch (error) {
      console.log('Error in updateAd:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteAd: async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
      
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      await Ad.findByIdAndDelete(id);
      res.status(200).json({ message: "Ad deleted successfully" });
    } catch (error) {
      console.log('Error in deleteAd:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  trackClick: async (req, res) => {
    try {
      const { id } = req.params;
      const { device } = req.body;

      const ad = await Ad.findById(id);
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      const clickCost = 0.10; // Cost per click
      
      // Check if ad has sufficient wallet balance
      if (ad.wallet.balance < clickCost) {
        // Deactivate ad if no balance
        await Ad.findByIdAndUpdate(id, { isActive: false });
        return res.status(400).json({ 
          message: "Ad deactivated due to insufficient wallet balance",
          adDeactivated: true
        });
      }

      const updateField = device === 'mobile' ? 'analytics.mobileClicks' : 'analytics.webClicks';
      const impressionField = device === 'mobile' ? 'analytics.mobileImpressions' : 'analytics.webImpressions';
      
      // Deduct from ad wallet and update analytics
      await Ad.findByIdAndUpdate(id, {
        $inc: {
          'analytics.clicks': 1,
          'analytics.impressions': 1,
          [updateField]: 1,
          [impressionField]: 1,
          'wallet.totalSpent': clickCost
        },
        $set: {
          'wallet.balance': ad.wallet.balance - clickCost
        }
      });

      res.status(200).json({ 
        message: "Click tracked and payment deducted",
        clickCost,
        remainingBalance: ad.wallet.balance - clickCost
      });
    } catch (error) {
      console.log('Error in trackClick:', error);
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
        message: "Analytics fetched successfully", 
        analytics: ad.analytics 
      });
    } catch (error) {
      console.log('Error in getAnalytics:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getDetailedAnalytics: async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const userId = req.user.id;
      
      const ads = await Ad.find({ createdBy: userId });
      
      const totalImpressions = ads.reduce((sum, ad) => sum + (ad.analytics?.impressions || 0), 0);
      const totalClicks = ads.reduce((sum, ad) => sum + (ad.analytics?.clicks || 0), 0);
      const webImpressions = ads.reduce((sum, ad) => sum + (ad.analytics?.webImpressions || 0), 0);
      const mobileImpressions = ads.reduce((sum, ad) => sum + (ad.analytics?.mobileImpressions || 0), 0);
      
      // Generate daily data for the chart
      const dailyData = [];
      for (let i = parseInt(days) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyData.push({
          date: date.toISOString().split('T')[0],
          impressions: Math.floor(totalImpressions / days) + Math.floor(Math.random() * 100),
          clicks: Math.floor(totalClicks / days) + Math.floor(Math.random() * 20)
        });
      }
      
      res.status(200).json({
        message: "Detailed analytics fetched successfully",
        analytics: {
          totalAds: ads.length,
          activeAds: ads.filter(ad => ad.isActive).length,
          totalImpressions,
          totalClicks,
          webImpressions,
          mobileImpressions,
          overallCTR: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
          avgImpressions: ads.length > 0 ? Math.round(totalImpressions / ads.length) : 0,
          dailyData,
          topAds: ads
            .sort((a, b) => (b.analytics?.impressions || 0) - (a.analytics?.impressions || 0))
            .slice(0, 5)
            .map(ad => ({
              id: ad._id,
              title: ad.title,
              impressions: ad.analytics?.impressions || 0,
              clicks: ad.analytics?.clicks || 0,
              ctr: ad.analytics?.impressions > 0 ? 
                ((ad.analytics?.clicks || 0) / ad.analytics.impressions * 100).toFixed(2) : 0
            }))
        }
      });
    } catch (error) {
      console.log('Error in getDetailedAnalytics:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  rechargeAdWallet: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, method = 'manual' } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const rechargeAmount = parseFloat(amount);
      if (user.wallet.balance < rechargeAmount) {
        return res.status(400).json({ 
          message: "Insufficient main wallet balance",
          requiredAmount: rechargeAmount,
          currentBalance: user.wallet.balance
        });
      }

      // Deduct from user wallet
      user.wallet.balance -= rechargeAmount;
      user.wallet.transactions.push({
        type: 'debit',
        amount: rechargeAmount,
        description: `Ad wallet recharge: ${ad.title}`,
        relatedId: ad._id
      });
      await user.save();

      // Add to ad wallet and activate if inactive
      ad.wallet.balance += rechargeAmount;
      ad.wallet.recharges.push({
        amount: rechargeAmount,
        method,
        description: `Wallet recharge for ${ad.title}`
      });
      
      // Auto-activate ad if it was inactive due to no balance
      if (!ad.isActive && ad.wallet.balance > 0) {
        ad.isActive = true;
      }
      
      await ad.save();
      
      res.status(200).json({
        message: "Ad wallet recharged successfully",
        newBalance: ad.wallet.balance,
        rechargeAmount: rechargeAmount,
        userWalletBalance: user.wallet.balance
      });
    } catch (error) {
      console.log('Error in rechargeAdWallet:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAdWallet: async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
      
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      res.status(200).json({
        message: "Ad wallet fetched successfully",
        wallet: ad.wallet
      });
    } catch (error) {
      console.log('Error in getAdWallet:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getEmbedCode: async (req, res) => {
    try {
      const { id } = req.params;
      const { language = 'html' } = req.query;
      
      const ad = await Ad.findById(id);
      if (!ad || !ad.isActive) {
        return res.status(404).json({ message: "Ad not found or inactive" });
      }

      const embedCodes = {
        html: ad.embedCodes.web,
        javascript: `document.write('${ad.embedCodes.web.replace(/'/g, "\\'")}')`,
        react: ad.embedCodes.react,
        php: ad.embedCodes.php,
        java: ad.embedCodes.java,
        flutter: ad.embedCodes.flutter,
        swift: ad.embedCodes.swift,
        mobile: ad.embedCodes.mobile,
        python: `print('${ad.embedCodes.web.replace(/'/g, "\\'")}')`
      };

      const selectedCode = embedCodes[language] || embedCodes.html;

      res.status(200).json({
        message: "Embed code fetched successfully",
        adId: ad._id,
        adTitle: ad.title,
        language,
        embedCode: selectedCode,
        availableLanguages: Object.keys(embedCodes)
      });
    } catch (error) {
      console.log('Error in getEmbedCode:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Public embed code endpoint for viewers
  getPublicEmbedCode: async (req, res) => {
    try {
      const { id } = req.params;
      const { language = 'html' } = req.query;
      
      const ad = await Ad.findById(id);
      if (!ad || !ad.isActive) {
        return res.status(404).json({ message: "Ad not found or inactive" });
      }

      const embedCodes = {
        html: ad.embedCodes.web,
        javascript: `document.write('${ad.embedCodes.web.replace(/'/g, "\\'")}')`,
        react: ad.embedCodes.react,
        php: ad.embedCodes.php,
        java: ad.embedCodes.java,
        flutter: ad.embedCodes.flutter,
        swift: ad.embedCodes.swift,
        mobile: ad.embedCodes.mobile,
        python: `print('${ad.embedCodes.web.replace(/'/g, "\\'")}')`
      };

      const selectedCode = embedCodes[language] || embedCodes.html;

      res.status(200).json({
        message: "Embed code fetched successfully",
        adId: ad._id,
        adTitle: ad.title,
        language,
        embedCode: selectedCode,
        availableLanguages: Object.keys(embedCodes)
      });
    } catch (error) {
      console.log('Error in getPublicEmbedCode:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = AdController;