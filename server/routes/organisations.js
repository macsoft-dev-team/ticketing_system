const express = require("express");
const router = express.Router();
const organisationController = require("../controller/organisations");

router.get("/", organisationController.getAll);
router.get("/:id", organisationController.getById);
router.post("/", organisationController.create);
router.put("/:id", organisationController.update);
router.delete("/:id", organisationController.deleteOrganisation);
 
module.exports = router;
