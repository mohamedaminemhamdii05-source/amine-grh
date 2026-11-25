const User = require('../models/user');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { isProtectedDemoAccount } = require('../demo/demo-data');

const DEMO_LOCKED = { message: 'this is disabled for the demo accounts, so every visitor can still log in' };

// deletes a user's old photo from backend/uploads (never the shared default admin.png)
const deleteUploadedFile = (fileName) => {
    if (!fileName || fileName === 'admin.png') return;
    const file = path.join(__dirname, '..', 'uploads', path.basename(fileName));
    fs.unlink(file, () => {});
}

// ---------- helpers ----------

const text = (value) => (typeof value === 'string' ? value.trim() : '');

const parseTags = (value) => {
    if (value === undefined) return undefined;
    try {
        const tags = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(tags) ? tags.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim()) : [];
    } catch (e) {
        return [];
    }
}

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// a user object that never contains the password hash
const safeUser = (user) => {
    const u = user.toObject ? user.toObject() : { ...user };
    delete u.password;
    return u;
}

const createToken = (user) => {
    let payload = {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        tel: user.tel,
        image: user.image,
        role: user.role,
        tags: user.tags,
        date: user.date
    }
    return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}

const sendError = (res, error) => {
    if (error && error.code === 11000) {
        return res.status(409).send({ message: 'this email is already used by another account' });
    }
    if (error && error.name === 'CastError') {
        return res.status(400).send({ message: 'invalid id' });
    }
    console.log(error);
    res.status(500).send({ message: 'server error' });
}

// ---------- default admin ----------

const createAdminAccount = async () => {

    try {

        let existAdmin = await User.find({ role: 'admin' });
        if (existAdmin.length == 0) {

            if (!process.env.EMAIL || !process.env.PASS) {
                return console.log('no admin yet: set EMAIL and PASS in backend/.env and restart to create it');
            }

            let data = {

                fullname: 'ADMIN ADMIN',
                email: process.env.EMAIL,
                password: process.env.PASS,
                image: 'admin.png',
                tel: process.env.TEL,
                role: 'admin',
                date: new Date()

            }

            let admin = new User(data);
            admin.password = bcrypt.hashSync(data.password, 10);

            await admin.save();
            console.log('admin created , you can use the application now !');

        } else {
            console.log('admin already exist');
        }

    } catch (error) {
        console.log(error);
    }

}

// ---------- admin: employees ----------

const createUserAccount = async (req, res, fileName) => {

    try {

        const fullname = text(req.body.fullname);
        const email = text(req.body.email).toLowerCase();
        const password = typeof req.body.password === 'string' ? req.body.password : '';

        if (!fullname || !isEmail(email)) {
            return res.status(400).send({ message: 'full name and a valid email are required' });
        }
        if (password.length < 6) {
            return res.status(400).send({ message: 'password must be at least 6 characters' });
        }

        let user = new User({
            fullname,
            email,
            tel: text(req.body.tel),
            tags: parseTags(req.body.tags) || [],
            password: bcrypt.hashSync(password, 10),
            image: fileName,
            role: 'user',
            date: new Date()
        });

        let result = await user.save();
        res.status(201).send(safeUser(result));

    } catch (error) {
        sendError(res, error);
    }

}

const signIn = async (req, res) => {

    try {

        const email = text(req.body.email).toLowerCase();
        const password = typeof req.body.password === 'string' ? req.body.password : '';

        if (!email || !password) {
            return res.status(401).send({ message: 'email or password invalid' });
        }

        // case-insensitive email match (accounts created before emails were stored in lowercase)
        const user = await User.findOne({ email: email }).collation({ locale: 'en', strength: 2 });
        if(!user){
           return res.status(401).send({ message: 'email or password invalid' });
        }

        const valid = bcrypt.compareSync( password, user.password );

        if(!valid){
            return res.status(401).send({ message: 'email or password invalid' });
        }

        res.status(200).send({ myToken: createToken(user) });

    } catch (error) {
        sendError(res, error);
    }

}

const list = async (req, res) => {

    try {

        let users = await User.find({ role: 'user' }, { password: 0 });
        res.status(200).send(users);

    } catch (error) {
        sendError(res, error);
    }

}

const byId = async (req, res) => {

    try {

        let user = await User.findById({ _id: req.params.id }, { password: 0 });
        if (!user) {
            return res.status(404).send({ message: 'user not found' });
        }
        res.status(200).send(user);

    } catch (error) {
        sendError(res, error);
    }

}

// admins can delete employees, never an admin account
const deleteUser = async (req, res) => {

    try {

        if (isProtectedDemoAccount(await User.findById({ _id: req.params.id }).select('email'))) {
            return res.status(403).send(DEMO_LOCKED);
        }

        let deletedUser = await User.findOneAndDelete({ _id: req.params.id, role: 'user' });
        if (!deletedUser) {
            return res.status(404).send({ message: 'user not found' });
        }
        res.status(200).send(safeUser(deletedUser));

    } catch (error) {
        sendError(res, error);
    }

}

// admins edit employees (never an admin account, never the role)
const update = async (req, res, fileName) => {

    try {

        let data = {};

        if (req.body.fullname !== undefined) {
            if (!text(req.body.fullname)) return res.status(400).send({ message: 'full name is required' });
            data.fullname = text(req.body.fullname);
        }
        if (req.body.email !== undefined) {
            if (!isEmail(text(req.body.email))) return res.status(400).send({ message: 'a valid email is required' });
            data.email = text(req.body.email).toLowerCase();
        }
        if (req.body.tel !== undefined) {
            data.tel = text(req.body.tel);
        }
        if (req.body.tags !== undefined) {
            data.tags = parseTags(req.body.tags);
        }
        if (typeof req.body.password === 'string' && req.body.password.length > 0) {
            if (req.body.password.length < 6) return res.status(400).send({ message: 'password must be at least 6 characters' });
            data.password = bcrypt.hashSync(req.body.password, 10);
        }
        if (fileName.length > 0) {
            data.image = fileName;
        }

        // demo logins keep their email and password so every visitor can still log in
        if (data.email !== undefined || data.password !== undefined) {
            const current = await User.findById({ _id: req.params.id }).select('email');
            if (isProtectedDemoAccount(current) &&
                (data.password !== undefined || data.email !== current.email)) {
                return res.status(403).send(DEMO_LOCKED);
            }
        }

        let updatedUser = await User.findOneAndUpdate({ _id: req.params.id, role: 'user' }, data, { new: true });
        if (!updatedUser) {
            return res.status(404).send({ message: 'user not found' });
        }

        res.status(200).send(safeUser(updatedUser));

    } catch (error) {
        sendError(res, error);
    }

}

// Profile page: the logged-in user updates their own account and receives a fresh token
// (the header reads name and image from the token). Only these fields can change - never the role.
const updateProfile = async (req, res, fileName) => {

    try {

        let data = {};

        if (req.body.fullname !== undefined) {
            if (!text(req.body.fullname)) return res.status(400).send({ message: 'full name is required' });
            data.fullname = text(req.body.fullname);
        }
        if (req.body.email !== undefined) {
            if (!isEmail(text(req.body.email))) return res.status(400).send({ message: 'a valid email is required' });
            data.email = text(req.body.email).toLowerCase();
        }
        if (req.body.tel !== undefined) {
            data.tel = text(req.body.tel);
        }
        if (req.body.tags !== undefined) {
            data.tags = parseTags(req.body.tags);
        }
        if (typeof req.body.password === 'string' && req.body.password.length > 0) {
            if (req.body.password.length < 6) return res.status(400).send({ message: 'password must be at least 6 characters' });
            data.password = bcrypt.hashSync(req.body.password, 10);
        }
        if (fileName.length > 0) {
            data.image = fileName;
        }

        // "Remove photo": clear the picture (the website then shows a default avatar)
        const removeImage = req.body.removeImage === 'true' && fileName.length === 0;
        if (removeImage) {
            data.image = '';
        }

        let previous = await User.findById({ _id: req.params.id }).select('image email');

        // demo logins keep their email and password so every visitor can still log in
        if (isProtectedDemoAccount(previous) &&
            (data.password !== undefined || (data.email !== undefined && data.email !== previous.email))) {
            return res.status(403).send(DEMO_LOCKED);
        }

        let user = await User.findByIdAndUpdate({ _id: req.params.id }, data, { new: true });
        if (!user) {
            return res.status(404).send({ message: 'user not found' });
        }

        if (removeImage && previous) {
            deleteUploadedFile(previous.image);
        }

        res.status(200).send({ myToken: createToken(user) });

    } catch (error) {
        sendError(res, error);
    }

}


module.exports = { createAdminAccount, createUserAccount, signIn, list, byId, deleteUser, update, updateProfile };
