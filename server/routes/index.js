const express = require("express");
const authenticate = require("../middleware/authenticate");

const router = express.Router();
const { login } = require("../middleware/login");
const { register } = require("../middleware/register");
const { forgotPassword, verifyResetCode, resetPassword } = require("../middleware/forgotPassword");
const user = require("./user");
const ticket = require("./ticket");
const notification = require("./notification");
const conversation = require("./conversation");
const organisation = require("./organisations");
const serviceCenter = require("./serviceCenter");
const attachments = require("./attachments");
const milestones = require("./milestones");
const spareRequests = require("./spareRequests");
const product = require("./products");
const projects = require("./projects");
const uploadRoutes = require("./uploads");
const serviceCenterAssignment = require("./serviceCenterAssignment");
const states = require("./states");
const ticketCode = require("./ticketCode");
const settings = require("./settings");
const inventory = require("./inventory");
const inboundActivity = require("./inboundActivity");
const projectWA = require("./projectsWA");
const organisationWA = require("./organisationWA");
const statesWA = require("./statesWA");
const batch = require("./batch");

router.post("/auth/login", login);
router.post("/auth/register", register);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/verify-reset-code", verifyResetCode);
router.post("/auth/reset-password", resetPassword);
router.use("/users", authenticate, user);
router.use("/tickets", authenticate, ticket);
router.use("/batch", authenticate, batch);
router.use("/organisations", authenticate, organisation);
router.use("/service-centers", authenticate, serviceCenter);
router.use("/service-center-assignment", authenticate, serviceCenterAssignment);
router.use("/notifications", authenticate, notification);
router.use("/conversations", authenticate, conversation);
router.use("/attachments", authenticate, attachments);
router.use("/milestones", authenticate, milestones);
router.use("/spare-requests", authenticate, spareRequests);
router.use("/products", authenticate, product);
router.use("/projects", authenticate, projects);
router.use("/ticket-code", authenticate, ticketCode);
router.use("/settings", authenticate, settings);
router.use("/inventory", authenticate, inventory);
router.use("/inbound-activities", authenticate, inboundActivity);

// without authentication
router.use("/states", states);
router.use("/projectsWA", projectWA);
router.use("/organisationsWA", organisationWA);
router.use("/statesWA", statesWA);
//upload routes

router.use("/uploads", authenticate, uploadRoutes);
module.exports = router;
