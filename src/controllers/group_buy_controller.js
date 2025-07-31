const db = require("../models/group_buy_model");
const dbUser = require("../models/user_model");
const { success, throwError } = require("../utils/response");


// Create group buy
const create = async (req, res, next) => {
    try {
        const { title, description, product, targetQuantity, endDate, targetBlocks } = req.body;

        // Validate that user is organizer or participant can create
        const user = await dbUser.findById(req.user.userId);

        const groupBuy = new db({
            title,
            description,
            product,
            targetQuantity,
            endDate: new Date(endDate),
            organizer: req.user.id,
            targetBlocks
        });

        await groupBuy.save();

        success(res, { message: "Create Group Buy", data: groupBuy });
    } catch (error) {
        next(error);
    }
}

// Get group buys for user's location
const get = async (req, res, next) => {
    try {
        const user = await dbUser.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { town, estate, block } = user.address;

        let query;

        if (user.role === 'organizer') {
            query = { organizer: user._id };
        } else {
            query = {
                status: 'active',
                endDate: { $gt: new Date() },
                $or: [
                    { 'targetBlocks.town': town, 'targetBlocks.estate': estate, 'targetBlocks.block': block },
                    { 'targetBlocks.town': town, 'targetBlocks.estate': estate, 'targetBlocks.block': { $exists: false } },
                    { 'targetBlocks.town': town, 'targetBlocks.estate': { $exists: false } },
                ]
            };
        }

        const groupBuys = await db.find(query).populate('organizer', 'name email');

        success(res, { message: "Group buys", data: groupBuys });
    } catch (error) {
        next(error);
    }
};

// Get specific group buy
const details = async (req, res, next) => {
    try {
        const groupBuy = await db.findById(req.params.id)
            .populate('organizer', 'name email')
            .populate('participants.user', 'name email');

        if (!groupBuy) {
            throwError({ message: 'Group buy not found' });
        }

        success(res, { message: "Join group buy", data: groupBuy });
    } catch (error) {
        next(error);
    }
}

// Join group buy
const join = async (req, res, next) => {
    try {
        const { quantity = 1 } = req.body;
        const groupBuyId = req.params.id;
        const userId = req.user.id;

        const groupBuy = await db.findById(groupBuyId);
        if (!groupBuy) {
            throwError({ message: 'Group buy not found' });
        }

        if (groupBuy.status !== 'active' || groupBuy.endDate < new Date()) {
            throwError({ message: 'Group buy is not active' });
        }

        // Check if user already joined
        const existingParticipant = groupBuy.participants.find(p => p.user.toString() === userId);
        if (existingParticipant) {
            throwError({ message: 'Already joined this group buy' });
        }

        // Check if adding quantity exceeds target
        if (groupBuy.currentQuantity + quantity > groupBuy.targetQuantity) {
            throwError({ message: 'Would exceed target quantity' });
        }

        groupBuy.participants.push({ user: userId, quantity });
        groupBuy.currentQuantity += quantity;
        groupBuy.updatedAt = new Date();

        await groupBuy.save();

        success(res, { message: 'Successfully joined group buy', data: groupBuy });
    } catch (error) {
        next(error);
    }
}

// Leave group buy
const leave = async (req, res, next) => {
    try {
        const groupBuyId = req.params.id;
        const userId = req.user.id;

        const groupBuy = await db.findById(groupBuyId);
        if (!groupBuy) {
            throwError({ message: 'Group buy not found' });
        }

        const participantIndex = groupBuy.participants.findIndex(p => p.user.toString() === userId);
        if (participantIndex === -1) {
            throwError({ message: 'Not a participant in this group buy' });
        }

        const participant = groupBuy.participants[participantIndex];
        groupBuy.currentQuantity -= participant.quantity;
        groupBuy.participants.splice(participantIndex, 1);
        groupBuy.updatedAt = new Date();

        await groupBuy.save();

        success(res, { message: 'Successfully left group buy', data: groupBuy });
    } catch (error) {
        next(error);
    }
}

module.exports = { create, get, details, join, leave }