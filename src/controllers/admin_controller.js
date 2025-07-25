const db = require("../models/user_model");
const dbGroupBuy = require("../models/group_buy_model");
const dbHDB = require("../models/hdb_model");
const { success } = require("../utils/response");
const getAllUsers = async (req, res, next) => {
    try {
        const users = await db.find().select('-password -otp -resetOtp');
        success(res, { message: "Get all users", data: users });
    } catch (error) {
        next(error);
    }
}

const getAllGroupBuys = async (req, res, next) => {
    try {
        const groupBuys = await dbGroupBuy.find()
            .populate('organizer', 'name email')
            .populate('participants.user', 'name email');
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