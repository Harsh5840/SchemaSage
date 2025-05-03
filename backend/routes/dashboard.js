
const express = require('express');
const dashboardRouter = express.Router();
const { getUserDashboards } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

dashboardRouter.get('/', verifyToken, getUserDashboards);

module.exports = dashboardRouter;
