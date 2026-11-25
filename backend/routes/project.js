const express = require('express');

const router = express.Router();

const { create, list, byId, preview, deleteProject, update } = require('../controllers/project');
const { verifyToken, isAdmin } = require('../config/auth/middleware');
const { documentUpload } = require('../config/upload');

const filesOf = (req) => (req.files || []).map((f) => f.filename);

router.use(verifyToken);

// any logged-in user
router.get('/list', list);
router.get('/preview/:id', preview);

// admin only
router.post('/create', isAdmin, documentUpload.any(), (req, res)=>{
    create(req, res, filesOf(req));
});

router.put('/update/:id', isAdmin, documentUpload.any(), (req, res)=>{
    update(req, res, filesOf(req));
});

router.get('/byid/:id', isAdmin, byId);
router.delete('/delete/:id', isAdmin, deleteProject);

module.exports = router;
