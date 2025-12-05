const express = require("express");
const router = express.Router();
const userService = require("../controller/users");

router.get("/", userService.getAll);
router.get("/me", userService.getCurrentUser);
router.get("/:id", userService.getById);
router.post("/", userService.create);
router.put("/:id", userService.update);
router.put("/profile/update", userService.updateProfile);
router.patch("/me/organization", userService.updateOrganization);
router.delete("/:id", userService.deleteUser);

module.exports = router;
