const express = require('express');

const router = express.Router();

const { byId, deleteBoard, update } = require('../controllers/board');
const { verifyToken, isAdmin } = require('../config/auth/middleware');

router.use(verifyToken);

router.get('/byid/:id', byId);
router.put('/update/:id', update);              // admin or a team member of the board's project (checked in the controller)
router.delete('/delete/:id', isAdmin, deleteBoard);

module.exports = router;
