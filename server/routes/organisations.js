const express = require("express");
const router = express.Router();
const organisationService = require("../controller/organisations");

router.get("/", organisationService.getAll);
 
module.exports = router;
