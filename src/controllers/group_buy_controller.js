const db = require("../models/group_buy_model");
const dbUser = require("../models/user_model");
const { success, throwError } = require("../utils/response");


// Create group buy
const create = async (req, res, next) => {
    try {
        const { title, description, product, targetQuantity, endDate, targetBlocks } = req.body;

        // Validate that user is organizer only can create
        const user = await dbUser.findById(req.user.id);
        if (!user || user.role !== 'organizer' || user.role !== 'admin') {
            throwError({ error: 'Only organizers can create group buys' });
        }

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
        console.log("User " + user);
        if (!user) throwError({ error: 'User not found' });

        const { town, estate, block } = user.address || {};

        if (!town || !estate || !block) {
            throwError({ message: "Incomplete address in user profile", status: 400 });
        }

        let query;

        if (user.role === 'organizer') {
            // Organizer sees their own group buys
            query = { organizer: user._id };
        } else {
            // Participant sees group buys targeting their exact block
            query = {
                status: 'active',
                endDate: { $gt: new Date() },
                $or: [
                    {
                        'targetBlocks.town': town,
                        'targetBlocks.estate': estate,
                        'targetBlocks.block': block
                    },
                    {
                        'targetBlocks.town': town,
                        'targetBlocks.estate': estate,
                    }
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

        groupBuy.participants.push({ user: userId, quantity, joinedAt: new Date() });
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