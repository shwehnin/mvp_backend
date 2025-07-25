const router = require("express").Router();
const controller = require("../controllers/admin_controller");
const { requireAdmin } = require("../utils/helper");
const {
    validateToken,
} = require("../validation/validator");

router.get("/users", [validateToken, requireAdmin, controller.getAllUsers]);
router.get("/groups-buy", [validateToken, requireAdmin, controller.getAllGroupBuys]);
router.put("/hdb", [validateToken, requireAdmin, controller.updateHdb]);

module.exports = router;