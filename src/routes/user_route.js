const router = require("express").Router();
const controller = require("../controllers/user_account_controller");
const userValidator = require("../validation/schema/user");
const {
    validateMongoId,
    validateToken,
    validateRole,
    validateBody,
} = require("../validation/validator");

router.post("/register", [
    validateBody(userValidator.register),
    controller.register,
]);

router.post("/login", [validateBody(userValidator.login), controller.login]);
router.post("/verify-otp", [validateBody(userValidator.verify), controller.verifyOtp]);
router.get("/user", [validateToken, controller.user]);
router.post('/forgot-password', [controller.forgotPassword]);
router.post('/verify-reset-password', [controller.verifyResetOtp]);
router.post('/reset-password', [controller.resetPassword]);
router.get("/groups-buy/history", [validateToken, controller.history]);
router.put("/update", [validateToken, controller.updateUser]);

module.exports = router;