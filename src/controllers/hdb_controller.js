const db = require("../models/hdb_model");
const { success, throwError } = require("../utils/response");

const get = async (req, res, next) => {
    try {
        const hdbData = await db.find();
        const formattedData = {};

        hdbData.forEach(town => {
            formattedData[town.town] = {};
            town.estates.forEach(estate => {
                formattedData[town.town][estate.name] = estate.blocks;
            });
        });

        success(res, { message: "HDB data", data: formattedData });
    } catch (error) {
        next(error);
    }
}

const validateAddress = async (req, res, next) => {
    try {
        const { town, estate, block } = req.body;

        const hdbData = await db.findOne({ town });
        if (!hdbData) {
            throwError({ message: 'Invalid town' });
        }

        const estateData = hdbData.estates.find(e => e.name === estate);
        if (!estateData) {
            throwError({ message: 'Invalid estate for selected town' });
        }

        if (!estateData.blocks.includes(block)) {
            throwError({ error: 'Invalid block for selected estate' });
        }

        success(res, { message: 'Address is valid' });
    } catch (error) {
        next(error);
    }
}

module.exports = { get, validateAddress }