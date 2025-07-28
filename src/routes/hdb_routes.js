const router = require("express").Router();
const controller = require("../controllers/hdb_controller");
const userValidator = require("../validation/schema/user");

router.get("/data", [controller.get]);

module.exports = router;