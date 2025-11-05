const bcrypt = require("bcrypt");
const User = require("./UserModel");
const UserController = {
  RagiterUser: async (req, res) => {
    try {
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
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.log(error);
    }
  },
  Login: async (req,res)=>{
    try {
       const {usernameorEmail,password}=req.body; 
       if(!usernameorEmail||!password){
        return res.status(400).json({message:"All fields are required"});
       }
         const user = await User.findOne({
            $or:[{username:usernameorEmail},{email:usernameorEmail}]
         });
         if(!user){
        return res.status(400).json({message:"User not found"});
       }
         const isMatch= await bcrypt.compare(password,user.password);
            if(!isMatch){
                return res.status(400).json({message:"Invalid credentials"});
            }   
        res.status(200).json({message:"Login successful"});

    } catch (error) {
        console.log(error);
    }
  }
};


module.exports = UserController;