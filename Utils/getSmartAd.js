  // ==================== HELPER: Smart ad matching (Real-life) ====================
 const _getSmartAd =  async (device, platform, country, city, res) => {
    try {
      // ✅ Build targeting filter for real-life scenario
      const filter = {
        isActive: true,
        // Device targeting
        targetDevices: device,
        // Platform targeting
        targetPlatforms: platform,
      };

      // ✅ Optional: Add geographic targeting
      if (country || city) {
        // In production, you'd store user location in each ad or query differently
        // For now, we'll just filter by device/platform
        console.log(`📍 Location targeting: country=${country}, city=${city}`);
      }

      // ✅ Schedule filtering
      const now = new Date();
      filter.$or = [
        { 'schedule.isScheduled': false },
        {
          $and: [
            { 'schedule.isScheduled': true },
            { 'schedule.startDate': { $lte: now } },
            { 'schedule.endDate': { $gte: now } }
          ]
        }
      ];

      // ✅ Find all eligible ads
      const eligibleAds = await Ad.find(filter);

      if (eligibleAds.length === 0) {
        console.log(`⚠️ No eligible ads found for device=${device}, platform=${platform}`);
        return res.status(404).json({ 
          message: "No ads available for your device/platform combination",
          criteria: { device, platform, country, city }
        });
      }

      console.log(`📊 Found ${eligibleAds.length} eligible ads`);

      // ✅ Smart selection strategy:
      // 1. Weighted random (by performance: clicks/impressions ratio)
      // 2. Round-robin
      // 3. Simple random
      const selectedAd = AdController._selectAdByWeightedRandom(eligibleAds);

      // Select embed code
      let embedCode = selectedAd.embedCodes.web;
      if (platform && selectedAd.embedCodes[platform]) {
        embedCode = selectedAd.embedCodes[platform];
      } else if (device === 'mobile') {
        embedCode = selectedAd.embedCodes.mobile;
      }

      // ✅ Track impression
      const updateField = device === 'mobile' ? 'analytics.mobileImpressions' : 'analytics.webImpressions';
      await Ad.findByIdAndUpdate(selectedAd._id, {
        $inc: {
          'analytics.impressions': 1,
          [updateField]: 1
        }
      });

      console.log(`✅ Smart ad selected: ${selectedAd._id} (impressions: ${selectedAd.analytics.impressions})`);

      res.status(200).json({
        message: "Ad fetched successfully (smart matching)",
        ad: {
          ...selectedAd.toObject(),
          embedCode,
          device,
          platform,
          selectionMethod: 'weighted-random'
        }
      });

    } catch (error) {
      console.log("❌ Error in _getSmartAd:", error);
      throw error;
    }
  }