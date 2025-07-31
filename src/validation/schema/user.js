const Joi = require("joi");
exports.register = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    password: Joi.string().required(),
    address: Joi.object({
        town: Joi.string().required(),
        estate: Joi.string().required(),
        block: Joi.string().required(),
    }).required(),
}).options({ allowUnknown: true });

exports.login = Joi.object({
    password: Joi.string().required(),
}).options({ allowUnknown: true });

exports.verify = Joi.object({
    email: Joi.string().required(),
    otp: Joi.string().required(),
})