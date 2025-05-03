const express = require("express");
const dashboardRouter = express.Router();
const { getAllWorkspaces } = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/authMiddleware");

// Protect the route, ensuring that the user is authenticated
dashboardRouter.get("/workspaces", verifyToken, getAllWorkspaces);

module.exports = dashboardRouter;
