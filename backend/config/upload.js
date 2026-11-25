const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Every upload gets its own unique, unguessable name (no shared variable between requests).
const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, done) => {
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
        done(null, Date.now() + '-' + crypto.randomBytes(6).toString('hex') + ext);
    }
});

const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const DOCUMENT_TYPES = [...IMAGE_TYPES, '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.zip'];

const only = (allowed) => (req, file, done) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        return done(null, true);
    }
    const error = new Error('file type not allowed: ' + (ext || 'unknown'));
    error.status = 400;
    done(error);
};

// profile photos and client logos: images only, max 5 MB
const imageUpload = multer({ storage, fileFilter: only(IMAGE_TYPES), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

// project attachments: images and office documents, max 20 MB each, 10 files
const documentUpload = multer({ storage, fileFilter: only(DOCUMENT_TYPES), limits: { fileSize: 20 * 1024 * 1024, files: 10 } });

module.exports = { imageUpload, documentUpload };
