const jwt = require('jsonwebtoken');
const User = require('../../models/user');

// Requires a valid login token. The user is re-loaded from the database on every request,
// so a deleted account (or a changed role) takes effect immediately.
const verifyToken = async (req, res, next) => {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : '';
        if (!token) {
            return res.status(401).send({ message: 'login required' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findById(decoded._id).select('_id role');
        if (!user) {
            return res.status(401).send({ message: 'account no longer exists' });
        }

        req.user = { _id: String(user._id), role: user.role };
        next();
    } catch (error) {
        res.status(401).send({ message: 'invalid or expired token' });
    }
}

// Must be used after verifyToken.
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).send({ message: 'admin only' });
}

// Must be used after verifyToken: admins, or the user whose :id is in the URL.
const isAdminOrSelf = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user._id === String(req.params.id))) {
        return next();
    }
    res.status(403).send({ message: 'not allowed' });
}

module.exports = { verifyToken, isAdmin, isAdminOrSelf };
