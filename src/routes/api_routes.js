const express = require("express");
const router = express.Router();
const validator = require("../validation/validator");

router.use("/user", require('./user_route'));

router.use(validator.notFoundRoute);
router.use(validator.errorRoute);

module.exports = router;