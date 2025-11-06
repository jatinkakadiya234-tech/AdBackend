const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const Db = require('./Config/Db');
const UserRouter = require('./User/UserRoute');
const AdRouter = require('./Ad-banner/Adrouter');
dotenv.config();
const app = express();
app.use(cors());
app.use(cookieParser());
const PORT =  process.env.PORT||5500;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/user",UserRouter);
app.use("/api/ad",AdRouter);
Db();
app.get('/', (req, res) => {
  res.send('Hello World !');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

