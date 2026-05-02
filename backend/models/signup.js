const mongoose=require('mongoose')

const itemSchema=new mongoose.Schema({
    name:String,
    email: { type: String, unique: true },
    bloodgroup: String,
    address:String,
    contact:String,
    pincode:String,
    password:String,
    // New auth fields
    provider: { type: String, default: 'local' }, // 'local' or 'google'
    providerId: String,
    emailVerified: { type: Boolean, default: false },
    otp: String,
    otpExpiry: Date,
});

module.exports=mongoose.model("signUpUser",itemSchema);