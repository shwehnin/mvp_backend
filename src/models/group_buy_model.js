const { Schema, default: mongoose } = require("mongoose");

const GroupBuySchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    product: {
        type: String,
        required: true,
    },
    organizer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetQuantity: {
        type: Number,
        required: true,
    },
    currentQuantity: {
        type: Number,
        default: 0
    },
    targetBlocks: [{
        town: String,
        estate: String,
        block: String
    }],
    participants: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        quantity: {
            type: Number,
            default: 1
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    endDate: {
        type: Date,
        required: true
    },
}, { timestamps: true });

module.exports = mongoose.model("GroupBuy", GroupBuySchema);