const mongoose = require('mongoose');

const userOTPVerificationSchema = new mongoose.Schema({
    userId: String,
    uniqueString: String,
    createdAt: Date,
    expiresAt: Date,
})

module.exports = mongoose.model("UserOTPVerification", userOTPVerificationSchema)
