const express = require("express");
const router = express.Router();
const userService = require("../controller/users");

router.get("/", userService.getAll);

module.exports = router;
