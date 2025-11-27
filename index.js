// -------------------------------
// 🌐 Import Required Dependencies
// -------------------------------
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const Db = require("./Config/Db");

// -------------------------------
// 📦 Import Routes
// -------------------------------
const UserRouter = require("./User/UserRoute");
const CategoryRoute = require("./Category/CategoryRoute");
const CampaignRouter = require("./Campaign/CampaignRoute");

// -------------------------------
// ⚙️ Load Environment Variables
// -------------------------------
dotenv.config();

// -------------------------------
// 🚀 Initialize Express App
// -------------------------------
const app = express();
const PORT = process.env.PORT || 5500;

// -------------------------------
// 🧩 Middleware Setup
// -------------------------------
app.use(cors(
  {
    origin: "http://localhost:5173",
    credentials: true,
  }
)); 
app.use(cookieParser()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.static("public"));

// -------------------------------
// 🔗 Register API Routes
// -------------------------------
if (UserRouter && typeof UserRouter === 'function') app.use("/api/user", UserRouter); 
if (CategoryRoute && typeof CategoryRoute === 'function') app.use("/api/category", CategoryRoute);
if (CampaignRouter && typeof CampaignRouter === 'function') app.use("/api/campaign", CampaignRouter); 

// -------------------------------
// 🗄️ Database Connection
// -------------------------------
Db(); // Connect to the database

// -------------------------------
// 🏠 Default Route
// -------------------------------
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// -------------------------------
// 🟢 Start Server
// -------------------------------
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});























// // app.js

// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');
// const dotenv = require('dotenv');
// const routes = require('./routes');

// dotenv.config();

// const app = express();

// // Security middleware
// app.use(helmet());
// app.use(mongoSanitize());

// // CORS configuration
// app.use(cors({
//   origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
//   credentials: true
// }));

// // Body parsing middleware
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));

// // Request logging (optional)
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//   next();
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', timestamp: new Date().toISOString() });
// });

// // API routes
// app.use('/api', routes);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('Error:', err);
  
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({
//       success: false,
//       message: err.message
//     });
//   }
  
//   res.status(500).json({
//     success: false,
//     message: err.message || 'Internal server error'
//   });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// module.exports = app;
