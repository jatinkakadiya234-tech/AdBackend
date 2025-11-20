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
