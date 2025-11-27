const PublisherProfile = require('../models/PublisherProfile');

// ============================================
// CREATE OR GET PROFILE
// ============================================
const createOrGetProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await PublisherProfile.findOne({ userId });

    if (profile) {
      return res.json({
        success: true,
        message: 'Profile retrieved',
        profile
      });
    }

    profile = new PublisherProfile({
      userId,
      kycStatus: 'not_submitted'
    });

    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Profile created',
      profile
    });

  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// UPDATE COMPANY INFO
// ============================================
const updateCompanyInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      legalName,
      registrationNumber,
      taxId,
      incorporationDate,
      industry,
      description,
      address,
      AuthorizedPersonName,
      AuthorizedPersonDesignation
    } = req.body;

    // Validation
    if (!legalName || legalName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Legal name must be at least 3 characters'
      });
    }

    if (address) {
      if (!address.fullAddress || !address.country || !address.city) {
        return res.status(400).json({
          success: false,
          message: 'Full address, country, and city are required'
        });
      }
    }

    let profile = await PublisherProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Publisher profile not found'
      });
    }

    profile.company = {
      legalName: legalName.trim(),
      registrationNumber,
      taxId,
      incorporationDate,
      industry,
      description,
      address,
      AuthorizedPersonName,
      AuthorizedPersonDesignation
    };

    await profile.save();

    res.json({
      success: true,
      message: 'Company information updated',
      profile
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// UPDATE PLATFORM DETAILS
// ============================================
const updatePlatformDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      website,
      websiteCategory,
      websiteLanguage,
      websiteDescription,
      monthlyVisitors,
      primaryAudienceLocation,
      SocialMedia
    } = req.body;

    // Validation
    if (website && !/^https?:\/\/.+/i.test(website)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid website URL'
      });
    }

    let profile = await PublisherProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Publisher profile not found'
      });
    }

    profile.PlatformDetails = {
      ...profile.PlatformDetails,
      website,
      websiteCategory,
      websiteLanguage,
      websiteDescription,
      monthlyVisitors,
      primaryAudienceLocation,
      SocialMedia
    };

    await profile.save();

    res.json({
      success: true,
      message: 'Platform details updated',
      profile
    });

  } catch (error) {
    console.error('Update platform error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// UPDATE PAYMENT SETTINGS
// ============================================
const updatePaymentSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      bankName,
      accountNumber,
      accountHolderName,
      swiftCode,
      iban,
      ifscCode,
      bankAddress,
      minimumPayoutThreshold,
      paymentFrequency
    } = req.body;

    // Validation
    if (!bankName || !accountNumber || !accountHolderName) {
      return res.status(400).json({
        success: false,
        message: 'Bank name, account number, and holder name are required'
      });
    }

    if (!/^\d{9,18}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account number format'
      });
    }

    let profile = await PublisherProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Publisher profile not found'
      });
    }

    profile.paymentSettings = {
      bankName,
      accountNumber,
      accountHolderName,
      swiftCode,
      iban,
      ifscCode,
      bankAddress,
      paymentPreference: {
        minimumPayoutThreshold,
        paymentFrequency
      }
    };

    await profile.save();

    res.json({
      success: true,
      message: 'Payment settings updated',
      profile
    });

  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// SUBMIT KYC DOCUMENTS
// ============================================
const submitKYCDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bankStatement, websiteScreenShot, companyRegistrationDoc } = req.body;

    // Validation
    if (!bankStatement || !websiteScreenShot || !companyRegistrationDoc) {
      return res.status(400).json({
        success: false,
        message: 'All KYC documents are required'
      });
    }

    let profile = await PublisherProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Publisher profile not found'
      });
    }

    if (profile.kycStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'KYC already approved'
      });
    }

    profile.kycDocuments = {
      bankStatement: {
        fileUrl: bankStatement.fileUrl,
        fileName: bankStatement.fileName,
        uploadedAt: new Date(),
        verified: false
      },
      websiteScreenShot: {
        fileUrl: websiteScreenShot.fileUrl,
        fileName: websiteScreenShot.fileName,
        uploadedAt: new Date(),
        verified: false
      },
      companyRegistrationDoc: {
        fileUrl: companyRegistrationDoc.fileUrl,
        fileName: companyRegistrationDoc.fileName,
        uploadedAt: new Date(),
        verified: false
      }
    };

    profile.kycStatus = 'pending';
    profile.kycSubmittedAt = new Date();

    await profile.save();

    res.json({
      success: true,
      message: 'KYC documents submitted for verification',
      profile
    });

  } catch (error) {
    console.error('Submit KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// GET KYC STATUS
// ============================================
const getKYCStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const profile = await PublisherProfile.findOne({ userId })
      .select('kycStatus kycSubmittedAt kycApprovedAt kycRejectedAt kycRejectionReason kycDocuments');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Publisher profile not found'
      });
    }

    res.json({
      success: true,
      kycStatus: profile.kycStatus,
      submittedAt: profile.kycSubmittedAt,
      approvedAt: profile.kycApprovedAt,
      rejectedAt: profile.kycRejectedAt,
      rejectionReason: profile.kycRejectionReason,
      documentsUploaded: !!profile.kycDocuments
    });

  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  createOrGetProfile,
  updateCompanyInfo,
  updatePlatformDetails,
  updatePaymentSettings,
  submitKYCDocuments,
  getKYCStatus
};
