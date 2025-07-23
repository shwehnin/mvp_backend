const Joi = require("joi");
exports.register = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().required(),
    password: Joi.string().required(),
    address: Joi.object({
        town: Joi.string().required(),
        estate: Joi.string().required(),
        block: Joi.string().required(),
    }).required(),
}).options({ allowUnknown: true });