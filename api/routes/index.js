const express = require("express");
const authenticate = require("../middleware/authenticate");

const router = express.Router();
const { login } = require("../middleware/login");
const { register } = require("../middleware/register");
const user = require("./user");
const ticket = require("./ticket");
const notification = require("./notification");
const conversation = require("./conversation");


router.post("/login", login);
router.post("/register", register);
router.use("/user", authenticate, user);
router.use("/ticket", authenticate, ticket);
router.use("/notification", authenticate, notification);
router.use("/conversation", authenticate, conversation);

module.exports = router;
