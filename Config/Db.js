const { default: mongoose } = require("mongoose");


async function Db(params) {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Database connected successfully"); 
    } catch (error) {
        console.log("Database connection failed");
        console.log(error);
    }
}


module.exports = Db;