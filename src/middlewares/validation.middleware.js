// middleware/validation.js

const { body, validationResult } = require('express-validator');

/**
 * Campaign validation
 */
const validateCampaign = [
  body('campaignName')
    .trim()
    .notEmpty().withMessage('Campaign name required')
    .isLength({ min: 3 }).withMessage('Campaign name must be at least 3 characters'),
  
  body('adType')
    .isIn(['banner', 'rewarded', 'interstitial', 'url_shortener'])
    .withMessage('Invalid ad type'),
  
  body('budget.total')
    .isFloat({ min: 1 }).withMessage('Budget must be greater than 0'),
  
  body('campaignDuration')
    .isIn(['continuous', 'scheduled'])
    .withMessage('Invalid campaign duration'),
  
  // Validation error handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Ad validation
 */
const validateAd = [
  body('name')
    .trim()
    .notEmpty().withMessage('Ad name required')
    .isLength({ min: 3 }).withMessage('Ad name must be at least 3 characters'),
  
  body('adType')
    .isIn(['banner', 'rewarded', 'interstitial', 'url_shortener'])
    .withMessage('Invalid ad type'),
  
  body('common.landingPageUrl')
    .isURL().withMessage('Valid landing page URL required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateCampaign,
  validateAd
};
