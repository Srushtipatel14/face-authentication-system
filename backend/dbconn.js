const mongoose=require("mongoose");
require("dotenv").config();
const MONGO_URL=process.env.MONGO_URI;


const dbConnection=async()=>{
   try {
    await mongoose.connect(MONGO_URL)
    console.log("MongoDB Connection Successfully")

   } catch (error) {
    console.log("Error is : ",error);
   }
}

module.exports=dbConnection