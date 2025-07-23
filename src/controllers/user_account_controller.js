const db = require("../models/user_model");
const { skipCount, limitCount, encodePass, comparePass, makeToken, generateOTP } = require("../utils/helper");
const { success, throwError } = require("../utils/response");
const emailSender = require("../utils/email");

const register = async (req, res, next) => {
    try {
        const { name, email, phone, address, password } = req.body;
        // Check if user exists
        if (phone && password || email && password) {
            req.body.password = encodePass(password);
            var phoneInUse = await db.findOne({ phone });
            if (phoneInUse) {
                throwError({ message: "Phone is already in use" });
              }
            var emailInUse = await db.findOne({ email });
            if (emailInUse) throwError({ message: "Email is already in use" });
        }

        // Create user
        const user = new db({
            name, email, phone, address, password,
        });

        // Generate Otp
        const { otp, otpExpires } = generateOTP();
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();
        const createdData = await db.findById(user._id);
        const response = await emailSender.sendMail(
            email,
            "Verify Your Account",
            `Your OTP code is: ${otp}`
        );

        let userObj = createdData.toObject();
        delete userObj.password;
        success(res, { message: "User registered successfully. Please verify your email.", data: userObj });

    } catch (err) {
        next(err);
    }
}

const login = (req, res, next) => {
    try {

    } catch (err) {
        next(err);
    }

}

module.exports = { register, login };