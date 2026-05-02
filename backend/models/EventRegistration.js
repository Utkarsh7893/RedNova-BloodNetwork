const mongoose = require("mongoose");

const EventRegistrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "signUpUser", required: true },
  eventId: { type: String, required: true },
  eventName: { type: String, required: true },
  eventStart: String,
  eventEnd: String,
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

// Prevent duplicate registrations
EventRegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("EventRegistration", EventRegistrationSchema);
