const { Router } = require("express");
const {
    createOrGetChat,
    getMyChats,
    getChatMessages,
    sendMessage
} = require("../controllers/chat.controller");
const { verifyJWT } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/multer.middleware");

const router = Router();

// Apply auth middleware to all chat routes
router.use(verifyJWT);

router.route("/")
    .post(createOrGetChat)
    .get(getMyChats);

router.route("/:chatId/messages")
    .get(getChatMessages)
    .post(upload.fields([{ name: "attachments", maxCount: 5 }]), sendMessage);

module.exports = router;
