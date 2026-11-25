// One-off helper: copies EMAIL, PASS and TEL from backend/.env onto the existing admin account.
// Usage (from the backend folder):  node update-admin.js
// The password is hashed with bcrypt, exactly like the app does when it creates the admin.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');

(async () => {
    const { EMAIL, PASS, TEL } = process.env;
    if (!EMAIL || !PASS || !TEL) {
        console.log('EMAIL, PASS and TEL must all be set in backend/.env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grh75');

    const admin = await User.findOneAndUpdate(
        { role: 'admin' },
        { email: EMAIL, tel: TEL, password: bcrypt.hashSync(PASS, 10) },
        { new: true }
    );

    if (admin) {
        console.log('Admin updated. You can now log in with: ' + admin.email);
    } else {
        console.log('No admin found. Just start the server (node server.js) and it will create one from .env.');
    }

    await mongoose.disconnect();
})().catch((err) => {
    console.log('Update failed:', err.message);
    process.exit(1);
});
