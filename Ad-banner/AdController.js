const Ad = require('./AdBanner');

const AdController = {
  crateAd: async (req, res) => {
    try {
      const { width, height, imageUrl, clickUrl } = req.body;
      
      if (!width || !height || !imageUrl || !clickUrl) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const embedCodeWeb = `<a href="${clickUrl}" target="_blank"><img src="${imageUrl}" width="${width}" height="${height}" alt="Ad Banner" /></a>`;
      const embedCodeMobile = `<a href="${clickUrl}" target="_blank"><img src="${imageUrl}" width="100%" height="auto" alt="Ad Banner" style="max-width:${width}px;" /></a>`;

      const newAd = new Ad({
        width,
        height,
        imageUrl,
        clickUrl,
        createdBy: req.user.id,
        embedCodeWeb,
        embedCodeMobile
      });

      await newAd.save();
      res.status(201).json({ message: "Ad created successfully", ad: newAd });
    } catch (error) {
      console.log('Error in crateAd:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getEmbedCode: async (req, res) => {
    try {
      const { id } = req.params;
      const { platform } = req.query;
      
      const ad = await Ad.findById(id);
      if (!ad || !ad.isActive) {
        return res.status(404).json({ message: "Ad not found" });
      }

      let embedCode;
      
      switch(platform) {
        case 'react':
          embedCode = `<a href="${ad.clickUrl}" target="_blank" rel="noopener noreferrer">
  <img 
    src="${ad.imageUrl}" 
    width={${ad.width}} 
    height={${ad.height}} 
    alt="Ad Banner" 
    style={{maxWidth: '100%', height: 'auto'}}
  />
</a>`;
          break;
          
        case 'html':
          embedCode = ad.embedCodeWeb;
          break;
          
        case 'php':
          embedCode = `<?php echo '<a href="${ad.clickUrl}" target="_blank"><img src="${ad.imageUrl}" width="${ad.width}" height="${ad.height}" alt="Ad Banner" /></a>'; ?>`;
          break;
          
        case 'java':
          embedCode = `String adHtml = "<a href=\"${ad.clickUrl}\" target=\"_blank\"><img src=\"${ad.imageUrl}\" width=\"${ad.width}\" height=\"${ad.height}\" alt=\"Ad Banner\" /></a>";`;
          break;
          
        case 'mobile':
          embedCode = ad.embedCodeMobile;
          break;
          
        default:
          embedCode = ad.embedCodeWeb;
      }

      await Ad.findByIdAndUpdate(id, { $inc: { impressions: 1 } });
      
      res.status(200).json({ 
        embedCode, 
        platform: platform || 'html',
        adId: id 
      });
    } catch (error) {
      console.log('Error in getEmbedCode:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAds: async (req, res) => {
    try {
      const ads = await Ad.find({ createdBy: req.user.id }).populate('createdBy', 'username email');
      res.status(200).json({ ads });
    } catch (error) {
      console.log('Error in getAds:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateAd: async (req, res) => {
    try {
      const { id } = req.params;
      const { width, height, imageUrl, clickUrl, isActive } = req.body;

      const ad = await Ad.findOne({ _id: id, createdBy: req.user.id });
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      if (width) ad.width = width;
      if (height) ad.height = height;
      if (imageUrl) ad.imageUrl = imageUrl;
      if (clickUrl) ad.clickUrl = clickUrl;
      if (typeof isActive === 'boolean') ad.isActive = isActive;

      if (width || height || imageUrl || clickUrl) {
        ad.embedCodeWeb = `<a href="${ad.clickUrl}" target="_blank"><img src="${ad.imageUrl}" width="${ad.width}" height="${ad.height}" alt="Ad Banner" /></a>`;
        ad.embedCodeMobile = `<a href="${ad.clickUrl}" target="_blank"><img src="${ad.imageUrl}" width="100%" height="auto" alt="Ad Banner" style="max-width:${ad.width}px;" /></a>`;
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
      
      if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ message: "Invalid Ad ID format" });
      }
      
      const ad = await Ad.findByIdAndUpdate(
        id,
        { $inc: { clicks: 1 } },
        { new: true }
      );

      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      res.redirect(ad.clickUrl);
    } catch (error) {
      console.log("Error in trackClick:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  trackImpression: async (req, res) => {
    try {
      const { id } = req.params;
      await Ad.findByIdAndUpdate(id, { $inc: { impressions: 1 } });
      res.status(200).json({ message: "Impression tracked" });
    } catch (error) {
      console.log('Error in trackImpression:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};



module.exports = AdController;