const router = require("express").Router();
const controller = require("../controllers/group_buy_controller");
const userValidator = require("../validation/schema/user");
const {
    validateMongoId,
    validateToken,
} = require("../validation/validator");

router.get("/", [validateToken, controller.get]);
router.post("/create", [validateToken, controller.create]);
router.route("/:id")
    .get(validateMongoId, validateToken, controller.details);

router.post("/:id/join", [validateToken, validateMongoId, controller.join]);
router.post("/:id/leave", [validateToken, validateMongoId, controller.leave]);

module.exports = router;