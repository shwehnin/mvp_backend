const db = require("../models/user_model");
const { skipCount, limitCount, encodePass, comparePass, makeToken, generateOTP } = require("../utils/helper");
const { success, throwError } = require("../utils/response");
const emailSender = require("../utils/email");

const register = async (req, res, next) => {
    try {
        const { name, email, phone, address, password } = req.body;

        // Validate inputs
        if ((!phone && !email) || !password) {
            throwError({ message: "Email or phone and password are required", status: 400 });
        }

        // Check duplicates only if respective fields are provided
        if (phone) {
            const phoneInUse = await db.findOne({ phone });
            if (phoneInUse) throwError({ message: "Phone is already in use", status: 409 });
        }

        if (email) {
            const emailInUse = await db.findOne({ email });
            if (emailInUse) throwError({ message: "Email is already in use", status: 409 });
        }

        // Hash password
        const hashedPassword = encodePass(password);

        // Create user
        const user = new db({
            name,
            email,
            phone,
            address,
            password: hashedPassword,
        });

        // Generate OTP
        const { otp, otpExpires } = generateOTP();
        user.otpCode = otp;
        user.otpExpires = otpExpires;

        await user.save();

        // Send OTP email if email is provided
        if (email) {
            await emailSender.sendMail(
                email,
                "Verify Your Account",
                `Your OTP code is: ${otp}`
            );
        }

        // Prepare user object for response
        const userObj = user.toObject();
        delete userObj.password;

        success(res, {
            message: "User registered successfully. Please verify your account.",
            data: userObj,
        });

    } catch (err) {
        next(err);
    }
}


const verifyOtp = async (req, res, next) => {
    try {
        const { userId, otp } = req.body;

        const user = await db.findById(userId);
        if (!user) throwError({ message: "User not found!", status: 404 });

        if (
            user.otpCode !== otp ||
            !user.otpExpires ||
            user.otpExpires.getTime() < Date.now()
        ) {
            throwError({ message: 'Invalid or expired OTP', status: 400 });
        }

        // ✅ Log before clearing
        console.log('=== OTP VERIFICATION DEBUG ===');
        console.log('Input userId:', userId);
        console.log('Input otp:', otp);
        console.log('User in DB:', {
            id: user._id,
            otpCode: user.otpCode,
            otpExpires: user.otpExpires,
            isExpired: user.otpExpires?.getTime() < Date.now(),
        });


        user.isVerified = true;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();

        const userObj = user.toObject();
        delete userObj.password;

        const token = makeToken(userObj);

        return res.status(200).json({
            success: true,
            message: 'Account verified successfully',
            data: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                address: user.address,
                token: token,
            }
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throwError({ message: "invalid request data" });
        }

        const user = await db.findOne({ email });
        if (!user) {
            throwError({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            throwError({ message: 'Please verify your account first' });
        }

        if (user) {
            if (comparePass(password, user.password)) {
                let userObj = user.toObject();
                delete userObj.password;
                let token = makeToken(userObj);

                success(res, {
                    message: "Login success",
                    data: {
                        user: userObj,
                        token: token,
                    },
                });
            } else {
                throwError({ message: "invalid credentials" });
            }
        } else {
            throwError({ message: "invalid credentials" });
        }

    } catch (err) {
        next(err);
    }
}

const user = async (req, res, next) => {
    try {
        const user = await db.findById(req.user._id).select(" -__v");
        if (!user) throwError({ message: "request id not found" });

        let userObj = user.toObject();
        delete userObj.password;

        success(res, { message: "profile data", data: userObj });
    } catch (err) {
        next(err);
    }
}

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) throwError({ message: "Email is required", status: 400 });

        const user = await db.findOne({ email });
        if (!user) throwError({ message: "User not found", status: 404 });

        const { otp, otpExpires } = generateOTP();
        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = otpExpires;
        await user.save();

        await emailSender.sendMail(
            email,
            "Password Reset Request",
            `Your OTP code to reset your password is: ${otp}`
        );

        success(res, {
            message: "OTP sent to your email",
        });
    } catch (err) {
        next(err);
    }
};

const verifyResetOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) throwError({ message: "Email and OTP are required", status: 400 });

        const user = await db.findOne({ email });
        if (!user) throwError({ message: "User not found", status: 404 });

        if (
            user.resetPasswordOtp !== otp ||
            !user.resetPasswordExpires ||
            user.resetPasswordExpires.getTime() < Date.now()
        ) {
            throwError({ message: "Invalid or expired OTP", status: 400 });
        }

        success(res, {
            message: "OTP verified. You can now reset your password.",
        });
    } catch (err) {
        next(err);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            throwError({ message: "Email, OTP, and new password are required", status: 400 });
        }

        const user = await db.findOne({ email });
        if (!user) throwError({ message: "User not found", status: 404 });

        if (
            user.resetPasswordOtp !== otp ||
            !user.resetPasswordExpires ||
            user.resetPasswordExpires.getTime() < Date.now()
        ) {
            throwError({ message: "Invalid or expired OTP", status: 400 });
        }

        user.password = encodePass(newPassword);
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        success(res, {
            message: "Password reset successful. You can now log in with your new password.",
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, verifyOtp, login, user, forgotPassword, verifyResetOtp, resetPassword };