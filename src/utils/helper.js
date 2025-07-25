const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Hash password
const encodePass = (password) => bcrypt.hashSync(password, 10);

// Compare password with hashed password
const comparePass = (password, hashPassword) => bcrypt.compareSync(password, hashPassword);

// Generate OTP
const generateOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    return { otp, otpExpires };
}



// Generate JWT token
const makeToken = (payload) => {
    return jwt.sign({ data: payload }, process.env.JWT_SECRET_KEY, {
        expiresIn: '90d',
    });
}

// Decode JWT token
const decodeToken = (token) => jwt.decode(token, process.env.JWT_SECRET_KEY);

// Calculate skip count for pagination
const skipCount = (req) => {
    const page = Number(req.query.page || 0);
    return page > 0 ? (page - 1) * limitCount(req) : 0;
}

// Calculate limit count for pagination
const limitCount = (req) => {
    const defaultLimit = Number(process.env.LIMIT_COUNT) || 30;
    const maxLimit = 200;
    const limit = Number(req.query.limit || defaultLimit);

    return limit > 0 && limit <= maxLimit ? limit : defaultLimit;
}

// Determine sort order for query
const sort = (req) => (req.query.sort === "asc" ? 1 : -1);

// Create a regex pattern for flexible whitespace handling
const createFlexibleRegex = (searchTerm) => {
    const trimmedTerm = searchTerm.replace(/\s+/g, "");
    const pattern = trimmedTerm.split("").join("\\s*");
    return new RegExp(pattern, "i");
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = {
    encodePass,
    comparePass,
    makeToken,
    decodeToken,
    skipCount,
    limitCount,
    sort,
    createFlexibleRegex,
    generateOTP,
    requireAdmin,
}