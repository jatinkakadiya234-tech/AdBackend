const bcrypt = require("bcrypt");
const User = require("./UserModel");
const { transporter } = require("../Config/mailer");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();

const UserController = {
  RagiterUser: async (req, res) => {
    try {
      console.log('Request body:', req.body);
      
      if (!req.body) {
        return res.status(400).json({ message: "Request body is missing" });
      }
      
      const { username, email, password } = req.body;
      const allredyUser = await User.findOne({
        $or: [{ username: username }, { email: email }],
      });
      if (allredyUser) {
        return res
          .status(400)
          .json({ message: "Username or Email already exists" });
      }
      if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      let epassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        username,
        email,
        password: epassword,
      });
      await newUser.save();

      try {
        // const mailOptions = {
        //   from: process.env.EMAIL_USER,
        //   to: email,
        //   subject: "Welcome to Our Platform",
        //   text: `Hello ${username},\n\nThank you for registering on our platform! We're excited to have you on board.\n\nBest regards,\nThe Team`,
        // };
        // const info = await transporter.sendMail(mailOptions);
        // console.log("✅ Email sent:", info.response);

      } catch (emailError) {
        console.log("Email sending failed:", emailError.message);
      }

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.log('Error in RagiterUser:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  Login: async (req, res) => {
    try {
      console.log('Login request body:', req.body);
      
      if (!req.body) {
        return res.status(400).json({ message: "Request body is missing" });
      }
      
      const { usernameorEmail, password } = req.body;
      if (!usernameorEmail || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const user = await User.findOne({
        $or: [{ username: usernameorEmail }, { email: usernameorEmail }],
      });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      let token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
        res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "development",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
      res.status(200).json({ message: "Login successful" });

    } catch (error) {
      console.log('Error in Login:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = UserController;
