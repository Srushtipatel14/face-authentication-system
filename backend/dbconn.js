// const mongoose=require("mongoose");
require("dotenv").config();
// const MONGO_URL=process.env.MONGO_URI;


// const dbConnection=async()=>{
//    try {
//     await mongoose.connect(MONGO_URL)
//     console.log("MongoDB Connection Successfully")

//    } catch (error) {
//     console.log("Error is : ",error);
//    }
// }

// module.exports=dbConnection4

const mysql=require("mysql2");
const dbConnection=mysql.createConnection({
   host:process.env.HOST,
   user:process.env.USER,
   password:process.env.PASSWORD,
   database:process.env.DATABASE
});



dbConnection.connect(function(err){
   if(err){
      console.log("connection Error : ",err);
   }
   else{
      console.log("Database connection successfully");
   }
});

module.exports=dbConnection