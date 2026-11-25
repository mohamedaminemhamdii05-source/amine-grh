const express = require('express');

const router = express.Router();

const { create, list, byId, deleteClient, update } = require('../controllers/client');
const { verifyToken, isAdmin } = require('../config/auth/middleware');
const { imageUpload } = require('../config/upload');

const fileOf = (req) => (req.file ? req.file.filename : '');

// Clients management is admin only.
router.use(verifyToken, isAdmin);

router.post('/create', imageUpload.single('image'), (req, res)=>{
    create(req, res, fileOf(req));
});

router.get('/list', list);
router.get('/byid/:id', byId);
router.delete('/delete/:id', deleteClient);

router.put('/update/:id', imageUpload.single('image'), (req, res)=>{
    update(req, res, fileOf(req));
});

module.exports = router;
