const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, },
    password: { type: String, required: true, minlength: 6 },
    role: {
        type: String,
        enum: ['participant', 'organizer', 'admin'],
        default: 'participant'
    },
    address: {
        town: {
            type: String,
            required: true
        },
        estate: {
            type: String,
            required: true
        },
        block: {
            type: String,
            required: true
        },
        unit: {
            type: String,
            required: false
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    otpCode: String,
    otpExpires: Date,
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);