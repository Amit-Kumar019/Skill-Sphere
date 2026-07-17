const { Router } = require("express");
const { createDispute } = require("../controllers/dispute.controller");
const { verifyJWT } = require("../middleware/auth.middleware");

const router = Router();

router.post("/", verifyJWT, createDispute);

module.exports = router;
