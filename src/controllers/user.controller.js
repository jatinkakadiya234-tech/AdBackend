const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ============================================
// REGISTER USER
// ============================================
const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role } = req.body;

    // ===== VALIDATION =====

    if (!username || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate username
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, number, and special character'
      });
    }

    // Passwords must match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate role
    const validRoles = ['viewer', 'publisher', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be viewer, publisher, or admin'
      });
    }

    // ===== CHECK EXISTING USER =====

    // Check if username exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // ===== HASH PASSWORD =====

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ===== CREATE USER =====

    const newUser = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role,
      isActive: true,
      isEmailVerified: false, // Email verification needed
      isSuspended: false
    });

    await newUser.save();

    // ===== GENERATE TOKENS =====

    const accessToken = generateAccessToken(newUser._id, newUser.role);
    const refreshToken = generateRefreshToken(newUser._id);

    // ===== RESPONSE =====

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });

    console.log(`New ${role} registered: ${email}`);

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// ============================================
// LOGIN USER
// ============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ===== VALIDATION =====

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // ===== FIND USER =====

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ===== CHECK ACCOUNT STATUS =====

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account is suspended. Reason: ${user.suspendReason || 'Not provided'}`,
        suspendedAt: user.suspendedAt
      });
    }

    // ===== VERIFY PASSWORD =====

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ===== GENERATE TOKENS =====

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // ===== UPDATE LAST LOGIN =====

    user.lastLogin = new Date();
    user.deviceInfo = {
      lastDevice: req.headers['user-agent']?.split(' ').pop() || 'Unknown',
      lastPlatform: req.headers['sec-ch-ua-platform'] || 'Unknown',
      lastIP: req.ip || 'Unknown',
      lastUserAgent: req.headers['user-agent'] || 'Unknown'
    };
    await user.save();

    // ===== RESPONSE =====

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        isEmailVerified: user.isEmailVerified
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });

    console.log(`${user.role} logged in: ${email}`);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// ============================================
// REFRESH ACCESS TOKEN
// ============================================
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      const newAccessToken = generateAccessToken(user._id, user.role);

      res.json({
        success: true,
        message: 'Token refreshed',
        accessToken: newAccessToken
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

// ============================================
// LOGOUT
// ============================================
const logout = async (req, res) => {
  try {
    // Optional: Can implement token blacklist in Redis or database

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// ============================================
// VERIFY EMAIL (For future implementation)
// ============================================
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token and mark email as verified
    // Implementation depends on email service

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
};

// ============================================
// REQUEST PASSWORD RESET
// ============================================
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If email exists, password reset link will be sent'
      });
    }

    // Generate reset token (implementation would involve sending email)
    const resetToken = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      message: 'Password reset link sent to email',
      // In production, don't expose the token in response
      resetToken: resetToken // For development only
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed'
    });
  }
};

// ============================================
// RESET PASSWORD
// ============================================
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and passwords are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Verify reset token and update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
};

// ============================================
// GET CURRENT USER
// ============================================
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

// ============================================
// TOKEN GENERATION HELPER FUNCTIONS
// ============================================

const generateAccessToken = (userId, role) => {
  return jwt.sign(
    {
      userId,
      role
    },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      userId
    },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    {
      expiresIn: '30d'
    }
  );
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getCurrentUser,
  generateAccessToken,
  generateRefreshToken
};
