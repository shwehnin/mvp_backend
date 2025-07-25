const { default: mongoose, Schema } = require("mongoose");

const HdbModelSchema = new Schema({
    town: {type: String, required: true},
    estates: [{
        name: String,
        blocks: [String]
    }]
});

module.exports = mongoose.model("Hdb", HdbModelSchema);