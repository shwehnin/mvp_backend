const router = require("express").Router();
const controller = require("../controllers/hdb_controller");
const userValidator = require("../validation/schema/user");
const {
    validateMongoId,
    validateToken,
    validateRole,
    validateBody,
} = require("../validation/validator");


router.get("/data", [validateToken, controller.get]);


module.exports = router;