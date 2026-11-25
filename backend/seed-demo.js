// Loads the public demo data (fictional people, companies and projects).
// WARNING: this ERASES all users, clients, projects and boards in the database it connects to.
// It only runs when DEMO_MODE=true is set, and is meant for the separate demo database (e.g. MongoDB Atlas).
//
// Usage (from the backend folder), PowerShell:
//   $env:DEMO_MODE = 'true'; $env:MONGO_URI = '<your demo database>'; node seed-demo.js
require('dotenv').config();
const mongoose = require('mongoose');
const { seedDemo, isDemoMode } = require('./demo/demo-data');

(async () => {
    if (!isDemoMode()) {
        console.log('Refused: set DEMO_MODE=true to load demo data. This erases the database, so never use it on your real data.');
        process.exit(1);
    }
    if (!process.env.MONGO_URI) {
        console.log('Refused: set MONGO_URI to the demo database explicitly.');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    await seedDemo();
    await mongoose.disconnect();
})().catch((err) => {
    console.log('Demo seed failed:', err.message);
    process.exit(1);
});
