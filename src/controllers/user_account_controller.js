const db = require("../models/user_model");
const HDBData = require("../models/hdb_model");
const groupByDB = require("../models/group_buy_model");
const { skipCount, limitCount, encodePass, comparePass, makeToken, generateOTP } = require("../utils/helper");
const { success, throwError } = require("../utils/response");
const emailSender = require("../utils/email");

const register = async (req, res, next) => {
    try {
        const { name, email, phone, address, password, role } = req.body;

        // Validate inputs
        if ((!phone && !email) || !password) {
            throwError({ message: "Email or phone and password are required", status: 400 });
        }

        if (!address || !address.town || !address.estate || !address.block) {
            throwError({ message: "Complete address(town, estate, block) is required", status: 400 });
        }

        // Validate HDB address
        const hdbData = await HDBData.findOne({ town: new RegExp(`^${address.town}$`, 'i') });
        if (!hdbData) {
            throwError({ error: 'Invalid HDB town' });
        }

        const estateData = hdbData.estates.find(e => e.name === address.estate);
        if (!estateData || !estateData.blocks.includes(address.block)) {
            throwError({ error: 'Invalid HDB address' });
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

        // Generate OTP
        const { otp, otpExpires } = generateOTP();
        let user = await db.findOne({ $or: [{ email }, { phone }] });
        if (user) {
            if (user.isVerified) {
                throwError({ message: "User already exists and is verified", status: 409 });
            }
            // Resend OTP to unverified user
            user.otpCode = otp;
            user.otpExpires = otpExpires;
            user.password = encodePass(password);
            user.address = address;
        } else {
            // Create user
            user = new db({
                name,
                email,
                phone,
                address,
                password: hashedPassword,
                role,
                otpCode: otp,
                otpExpires,
            });
        }

        await user.save();

        // Send OTP email if email is provided
        if (email || phone) {
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
        const { email, phone, otp } = req.body;

        const user = await db.findOne({ $or: [{ email }, { phone }] });
        if (!user) throwError({ message: "User not found!", status: 404 });

        if (
            user.otpCode !== otp ||
            !user.otpExpires ||
            user.otpExpires.getTime() < Date.now()
        ) {
            throwError({ message: 'Invalid or expired OTP', status: 400 });
        }

        user.isVerified = true;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();

        const userObj = user.toObject();
        delete userObj.password;

        success(res, {
            message: 'Account verified successfully',
            data: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                address: user.address,
            }
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, phone, password } = req.body;

        if ((!email && !phone) || !password) {
            throwError({ message: "Email or phone and password are required", status: 400 });
        }

        const user = await db.findOne({ $or: [{ email }, { phone }] });
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
            message: "OTP sent to your email.",
        });
    } catch (err) {
        next(err);
    }
};

const verifyResetOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await db.findOne({ email });
        if (!user) {
            throwError({ message: "User not found!", status: 404 });
        }

        if (
            String(user.resetPasswordOtp) !== String(otp) ||
            Date.now() > user.resetPasswordExpires
        ) {
            throwError({ message: "Invalid or expired OTP", status: 400 });
        }
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        const userObj = user.toObject();
        delete userObj.password;

        success(res, {
            message: 'OTP confirmed successfully',
            data: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                address: user.address,
            }
        });
    } catch (e) {
        next(e);
    }
}

const resetPassword = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            throwError({ message: "Email and new password are required", status: 400 });
        }

        const user = await db.findOne({ email });
        if (!user) throwError({ message: "User not found", status: 404 });

        if (
            user.resetPasswordExpires < Date.now()
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

// update profile
const updateUser = async (req, res, next) => {
    try {
        const { name, email, phone, address } = req.body;
        const userId = req.user.id;

        // Validate HDB address if provided
        if (address) {
            const hdbData = await HDBData.findOne({ town: address.town });
            if (!hdbData) {
                throwError({ message: 'Invalid HDB town' });
            }

            const estateData = hdbData.estates.find(e => e.name === address.estate);
            if (!estateData || !estateData.blocks.includes(address.block)) {
                throwError({ message: 'Invalid HDB address' });
            }
        }

        const updatedUser = await db.findByIdAndUpdate(
            userId,
            {
                name,
                email,
                phone,
                address,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).select('-password -otp -resetOtp');

        success(res, {
            message: "Profile updated successfully!",
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
}

// Get join history for current user
const history = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Find group buys where user is in the participants list
        const groupBuys = await groupByDB.find({ 'participants.user': userId }).populate('organizer', 'name email').lean();
        // Filter participant data for this user only
        const history = groupBuys.map(gb => {
            const participant = gb.participants.find(p => p.user.toString() === userId);
            return {
                _id: gb._id,
                title: gb.title,
                product: gb.product,
                description: gb.description,
                organizer: gb.organizer,
                targetQuantity: gb.targetQuantity,
                currentQuantity: participant.currentQuantity || gb.currentQuantity,
                joinedAt: participant.joinedAt || gb.updatedAt,
                endDate: gb.endDate,
                status: gb.status
            }
        });
        success(res, { message: "View Order History", data: history });

        // // Get group buys user is participating in
        // const participatingIn = await groupByDB.find({
        //     'participants.user': userId
        // }).populate('organizer', 'name email');

        // success(res, {
        //     message: "Group buy user history",
        //     data: {
        //         participating: participatingIn,
        //     }
        // });
    } catch (error) {
        next(error);
    }
}

// Resend OTP for account verification
const resendVerificationOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) throwError({ message: "Email is required", status: 400 });
        const user = await db.find({ email });
        if (!user) throwError({ message: "User not found", status: 404 });
        if (user.isVerified) {
            throwError({ message: "User is verified", status: 400 });
        }

        // Generate new OTP
        const { otp, otpExpires } = generateOTP();
        user.otpCode = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send OTP email if email is provided
        if (email) {
            await emailSender.sendMail(email, "Verify Your Account - Resend OTP", `Your new OTP code is: ${otp}`);
        }

        success(res, { message: "Verification OTP resent successfully. Please check your email.", })
    } catch (e) {
        next(e);
    }
}

// Resend OTP for password reset
const resendResetPasswordOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) throwError({ message: "Email is required", status: 400 });

        const user = await db.find({ email })
        if (!user) throwError({ message: "User not found", status: 404 });

        // Check if there's an existing reset request
        if (!user.resetPasswordOtp && !user.resetPasswordExpires) {
            throwError({ message: "No active password reset request found. Please initiate forgot password first.", status: 400 });

        }
        // Generate new OTP
        const { otp, otpExpires } = generateOTP();
        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = otpExpires;
        await user.save();
        await emailSender.sendMail(
            email,
            "Password Reset - Resend OTP",
            `Your new OTP code to reset your password is: ${otp}`
        );
        success(res, {
            message: "Reset password OTP resent successfully. Please check your email.",
        });
    } catch (e) {
        next(e);
    }
}

module.exports = { register, verifyOtp, login, user, forgotPassword, resetPassword, updateUser, history, verifyResetOtp, resendVerificationOtp, resendResetPasswordOtp};