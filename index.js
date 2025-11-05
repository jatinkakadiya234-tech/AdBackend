const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Db = require('./Config/Db');
const UserRouter = require('./User/UserRoute');
dotenv.config();
const app = express();
app.use(cors());
const PORT =  process.env.PORT||5500;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/user",UserRouter)
Db();
app.get('/', (req, res) => {
  res.send('Hello World !');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

