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
    isSubscribedToAlerts: { type: Boolean, default: false },
    registeredEvents: { type: [String], default: [] },
    // Profile fields
    profilePhoto: { type: String, default: '' }, // Base64 or URL
    bio: { type: String, default: '' },
    gender: { type: String, default: '' },
    dob: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    isDonor: { type: Boolean, default: false },
    emergencyContact: { type: String, default: '' },
    lastDonation: { type: String, default: '' },
    medicalConditions: { type: String, default: '' },
}, { timestamps: true });

module.exports=mongoose.model("signUpUser",itemSchema);