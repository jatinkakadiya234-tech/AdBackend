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
const AdRouter = require("./Ad-banner/Adrouter");
const FavoriteRouter = require("./Favorite/FavriteRouter");
const CategoryRoute = require("./Category/CategoryRoute");
const JoinRequestRouter = require("./JoinRequest/JoinRequestRoute");

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
app.use("/api/user", UserRouter); 
app.use("/api/ad", AdRouter); 
app.use("/api/favorite", FavoriteRouter);
app.use("/api/category", CategoryRoute);
app.use("/api/join-request", JoinRequestRouter); 

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
