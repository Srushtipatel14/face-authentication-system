const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    user: String,
    pwd: String,
    descriptor: {
        type: [Number],  // Make sure it's an array of numbers
        required: true
    }
});
const User=mongoose.model('users',userSchema);
module.exports=User;