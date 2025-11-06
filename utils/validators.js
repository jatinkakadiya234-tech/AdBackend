const crypto = require('crypto');
const validator = require('validator');

/**
 * ✅ Validate a URL (ensures http or https)
 */
function validateURL(url) {
  if (!url || typeof url !== 'string') return false;
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  });
}

/**
 * ✅ Sanitize text input (prevents XSS / HTML injection)
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/script/gi, '') // Prevent "script" tags
    .trim();
}

/**
 * ✅ Generate tracking URL for impressions / clicks
 * Example: generateTrackingUrl('click', '677d123abc...') → https://api.example.com/api/v1/ads/track-click/677d123abc
 */
function generateTrackingUrl(type, adId) {
  const baseUrl = process.env.API_BASE_URL || 'https://your-backend-domain.com';
  if (!adId) return `${baseUrl}/api/v1/ads/track-${type}`;
  return `${baseUrl}/api/v1/ads/track-${type}/${adId}`;
}

/**
 * ✅ Generate a unique Placement ID
 * Example: generatePlacementId('rewarded') → "rewarded_1730834849123_7c2af"
 */
function generatePlacementId(adType = 'banner') {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(3).toString('hex');
  return `${adType}_${timestamp}_${randomStr}`;
}

module.exports = {
  validateURL,
  sanitizeInput,
  generateTrackingUrl,
  generatePlacementId
};
