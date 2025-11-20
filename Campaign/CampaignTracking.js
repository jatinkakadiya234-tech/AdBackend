const Campaign = require('./CampaignModel');
const User = require('../User/UserModel');

const CampaignTracking = {
  // Track click and deduct money
  trackClick: async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await Campaign.findById(id).populate('createdBy');
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const user = campaign.createdBy;
      const clickCost = 0.50;

      // Check if user has enough balance
      if (user.wallet.balance < clickCost) {
        return res.status(400).json({ 
          message: "Insufficient balance",
          balance: user.wallet.balance 
        });
      }

      // Deduct money and update stats
      user.wallet.balance -= clickCost;
      user.wallet.transactions.push({
        type: 'debit',
        amount: clickCost,
        reason: `Click on campaign: ${campaign.name}`
      });

      campaign.performance.clicks += 1;
      campaign.performance.spend += clickCost;

      await user.save();
      await campaign.save();

      res.status(200).json({
        message: "Click tracked and $0.50 deducted",
        remainingBalance: user.wallet.balance,
        totalClicks: campaign.performance.clicks
      });

    } catch (error) {
      console.log('Error in trackClick:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Track impression and deduct money
  trackImpression: async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await Campaign.findById(id).populate('createdBy');
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const user = campaign.createdBy;
      const impressionCost = 0.01; // Lower cost for impressions

      // Check if user has enough balance
      if (user.wallet.balance < impressionCost) {
        // Pause all user's campaigns if no balance
        await Campaign.updateMany(
          { createdBy: user._id, status: 'active' },
          { status: 'paused' }
        );
        
        return res.status(400).json({ 
          message: "Insufficient balance. All campaigns paused.",
          balance: user.wallet.balance 
        });
      }

      // Deduct money and update stats
      user.wallet.balance -= impressionCost;
      user.wallet.transactions.push({
        type: 'debit',
        amount: impressionCost,
        reason: `Impression on campaign: ${campaign.name}`,
        date: new Date()
      });

      campaign.performance.impressions += 1;
      campaign.performance.spend += impressionCost;
      campaign.wallet.totalSpent += impressionCost;

      await user.save();
      await campaign.save();

      res.status(200).json({
        message: "Impression tracked successfully",
        remainingBalance: user.wallet.balance,
        totalImpressions: campaign.performance.impressions
      });

    } catch (error) {
      console.log('Error in trackImpression:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = CampaignTracking;