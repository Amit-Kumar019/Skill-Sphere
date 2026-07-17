const { Router } = require("express");
const {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require("../controllers/notification.controller");
const { verifyJWT } = require("../middleware/auth.middleware");

const router = Router();

router.use(verifyJWT);

router.get("/", getMyNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
