const express = require('express');
const adminService = require('../services/adminService');
const { validateAdminReport, validateUserManagement } = require('../utils/validation');

const router = express.Router();

// Get all reports for moderation
router.get('/reports', async (req, res) => {
    try {
        const reports = await adminService.getAllReports();
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving reports', error });
    }
});

// Manage user accounts (e.g., ban, unban)
router.post('/manage-user', validateUserManagement, async (req, res) => {
    const { userId, action } = req.body;
    try {
        const result = await adminService.manageUser(userId, action);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error managing user', error });
    }
});

// Review and moderate content
router.post('/moderate-content', validateAdminReport, async (req, res) => {
    const { reportId, action } = req.body;
    try {
        const result = await adminService.moderateContent(reportId, action);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error moderating content', error });
    }
});

module.exports = router;