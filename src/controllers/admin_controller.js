const db = require("../models/user_model");
const dbGroupBuy = require("../models/group_buy_model");
const dbHDB = require("../models/hdb_model");
const { success } = require("../utils/response");
const { skipCount, limitCount } = require("../utils/helper");

const getAllUsers = async (req, res, next) => {
    try {
        const skip = skipCount(req);
        const limit = limitCount(req);
        const users = await db.find().select('-password -otp -resetOtp').skip(skip).limit(limit);
        success(res, { message: "Get all users", data: users });
    } catch (error) {
        next(error);
    }
}

const getAllGroupBuys = async (req, res, next) => {
    try {
        const skip = skipCount(req);
        const limit = limitCount(req);
        const groupBuys = await dbGroupBuy.find()
            .populate('organizer', 'name email')
            .populate('participants.user', 'name email').skip(skip).limit(limit);
        success(res, { message: "Group buy users", data: groupBuys });
    } catch (error) {
        next(error);
    }
}

const updateHdb = async (req, res, next) => {
    try {
        const { town, estates } = req.body;

        await dbHDB.findOneAndUpdate(
            { town },
            { town, estates },
            { upsert: true, new: true }
        );

        success(res, { message: 'HDB data updated successfully' });
    } catch (error) {
        next(error);
    }
}
module.exports = { getAllUsers, getAllGroupBuys, updateHdb }