const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const { createUserAccount, signIn, list, byId, deleteUser, update, updateProfile } = require('../controllers/user');
const { verifyToken, isAdmin, isAdminOrSelf } = require('../config/auth/middleware');
const { imageUpload } = require('../config/upload');

const fileOf = (req) => (req.file ? req.file.filename : '');

// Slow down password guessing: 10 failed attempts per 15 minutes per IP.
const signInLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'too many login attempts, please try again in 15 minutes' }
});

router.post('/signin', signInLimiter, signIn);

// Public demo only: the demo logins shown on the login page (404 on a normal installation)
const { isDemoMode, DEMO_ACCOUNTS } = require('../demo/demo-data');
router.get('/demo-accounts', (req, res) => {
    if (!isDemoMode()) {
        return res.status(404).send({ message: 'not found' });
    }
    res.status(200).send(DEMO_ACCOUNTS);
});

router.post('/createuseraccount', verifyToken, isAdmin, imageUpload.single('image'), (req, res)=>{
    createUserAccount(req, res, fileOf(req));
});

router.get('/list', verifyToken, isAdmin, list);
router.get('/byid/:id', verifyToken, isAdminOrSelf, byId);
router.delete('/delete/:id', verifyToken, isAdmin, deleteUser);

router.put('/update/:id', verifyToken, isAdmin, imageUpload.single('image'), (req, res)=>{
    update(req, res, fileOf(req));
});

// Profile page: logged-in user only, and only their own account (checked before any file is saved)
const ownProfileOnly = (req, res, next) => {
    if (req.user._id !== String(req.params.id)) {
        return res.status(403).send({ message: 'you can only update your own profile' });
    }
    next();
}

router.put('/updateprofile/:id', verifyToken, ownProfileOnly, imageUpload.single('image'), (req, res)=>{
    updateProfile(req, res, fileOf(req));
});


module.exports = router;
