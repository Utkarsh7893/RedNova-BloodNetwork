const mongoose = require("mongoose");

const BloodBankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  location: { // basic geo
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0,0] } // [lng, lat]
  },
  contact: String,
  email: String,
  // units stored per bloodgroup
  stock: {
    "A+": { type: Number, default: 0 },
    "A-": { type: Number, default: 0 },
    "B+": { type: Number, default: 0 },
    "B-": { type: Number, default: 0 },
    "AB+": { type: Number, default: 0 },
    "AB-": { type: Number, default: 0 },
    "O+": { type: Number, default: 0 },
    "O-": { type: Number, default: 0 }
  }
}, { timestamps: true });

BloodBankSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("BloodBank", BloodBankSchema);
