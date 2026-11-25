const mongoose = require('mongoose');

// Ignore MongoDB operators ($ne, $gt, ...) inside request data used in queries (NoSQL injection protection).
mongoose.set('sanitizeFilter', true);

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grh75';

mongoose.connect(uri)
    .then(
        ()=>{
            console.log('connected');
        }
    )
    .catch(
        (err)=>{
            console.log('MongoDB connection failed:', err.message);
        }
    )
