const express = require("express");
const router = express.Router();
const validator = require("../validation/validator");

router.use("/user", require('./user_route'));
router.use('/hdb', require('./hdb_routes'));
router.use("/groups-buy", require("./group_buy_routes"));
router.use("/admin", require("./admin_routes"));

router.use(validator.notFoundRoute);
router.use(validator.errorRoute);

module.exports = router;