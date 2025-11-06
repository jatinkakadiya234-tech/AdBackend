const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./UserModel");
const { transporter } = require("../Config/mailer");

const UserController = {
  registerUser: async (req, res) => {
    try {
      console.log('Request body:', req.body);
      
      if (!req.body) {
        return res.status(400).json({ message: "Request body is missing" });
      }
      
      const { username, email, password, role, profile, preferences, device, platform } = req.body;
      
      // Trim whitespace from all string inputs
      const trimmedData = {
        username: username?.trim(),
        email: email?.trim(),
        password: password?.trim(),
        role: role?.trim(),
        device: device?.trim(),
        platform: platform?.trim()
      };
      
      const existingUser = await User.findOne({
        $or: [{ username: trimmedData.username }, { email: trimmedData.email }],
      });
      
      if (existingUser) {
        return res.status(400).json({ message: "Username or Email already exists" });
      }
      
      if (!trimmedData.username || !trimmedData.email || !trimmedData.password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      let hashedPassword = await bcrypt.hash(trimmedData.password, 10);
      
      const newUser = new User({
        username: trimmedData.username,
        email: trimmedData.email,
        password: hashedPassword,
        role: trimmedData.role || 'viewer',
        profile: profile || {},
        preferences: {
          preferredDevices: preferences?.preferredDevices || [trimmedData.device || 'web'],
          preferredPlatforms: preferences?.preferredPlatforms || [trimmedData.platform || 'html'],
          notifications: preferences?.notifications !== false,
          language: preferences?.language || 'en'
        },
        deviceInfo: {
          lastDevice: trimmedData.device || 'web',
          lastPlatform: trimmedData.platform || 'html',
          lastIP: req.ip
        }
      });
      
      await newUser.save();

      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Welcome to Our Ad Platform",
          text: `Hello ${trimmedData.username},\n\nWelcome to our advertising platform! Your account has been created successfully.\n\nRole: ${newUser.role}\nDevice: ${trimmedData.device || 'web'}\nPlatform: ${trimmedData.platform || 'html'}\n\nBest regards,\nThe Team`,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent:", info.response);
      } catch (emailError) {
        console.log("Email sending failed:", emailError.message);
      }

      const token = jwt.sign(
        { id: newUser._id, username: newUser.username, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({ 
        message: "User registered successfully", 
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          preferences: newUser.preferences
        }
      });
    } catch (error) {
      console.log('Error in registerUser:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  login: async (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body;
      
      // Trim whitespace
      const trimmedUsernameOrEmail = usernameOrEmail?.trim();
      const trimmedPassword = password?.trim();
      
      if (!trimmedUsernameOrEmail || !trimmedPassword) {
        return res.status(400).json({ message: "Username/Email and password are required" });
      }
      
      const user = await User.findOne({
        $or: [{ username: trimmedUsernameOrEmail }, { email: trimmedUsernameOrEmail }],
      });
      
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      if (!user.isActive) {
        return res.status(400).json({ message: "Account is deactivated" });
      }
      
      const isMatch = await bcrypt.compare(trimmedPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Only update last login
      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, { 
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production'
      });

      res.status(200).json({ 
        message: "Login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          wallet: { balance: user.wallet.balance, currency: user.wallet.currency }
        }
      });
    } catch (error) {
      console.log('Error in login:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ user });
    } catch (error) {
      console.log('Error in getProfile:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { profile, preferences } = req.body;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (profile) {
        user.profile = { ...user.profile, ...profile };
      }
      
      if (preferences) {
        user.preferences = { ...user.preferences, ...preferences };
      }

      await user.save();
      res.status(200).json({ message: "Profile updated successfully", user: user });
    } catch (error) {
      console.log('Error in updateProfile:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getUsersByDevice: async (req, res) => {
    try {
      const { device, platform } = req.query;
      let filter = {};
      
      if (device) filter['preferences.preferredDevices'] = device;
      if (platform) filter['preferences.preferredPlatforms'] = platform;

      const users = await User.find(filter).select('-password');
      res.status(200).json({ users, count: users.length });
    } catch (error) {
      console.log('Error in getUsersByDevice:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  addWalletBalance: async (req, res) => {
    try {
      const { amount, description } = req.body;
      
      // Parse amount as number and validate
      const parsedAmount = parseFloat(amount);
      
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Valid positive amount is required" });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.wallet.balance += parsedAmount;
      user.wallet.transactions.push({
        type: 'credit',
        amount: parsedAmount,
        description: description?.trim() || 'Balance added'
      });

      await user.save();
      res.status(200).json({ 
        message: "Balance added successfully", 
        newBalance: user.wallet.balance 
      });
    } catch (error) {
      console.log('Error in addWalletBalance:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getWalletTransactions: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('wallet');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ 
        balance: user.wallet.balance,
        currency: user.wallet.currency,
        transactions: user.wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
      });
    } catch (error) {
      console.log('Error in getWalletTransactions:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie('token');
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.log('Error in logout:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = UserController;