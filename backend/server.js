require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// ---------- required settings ----------
if (!process.env.SECRET_KEY) {
    console.log('ERROR: SECRET_KEY is missing in backend/.env - the server will not start without it.');
    process.exit(1);
}
if (process.env.SECRET_KEY.length < 32) {
    console.log('WARNING: SECRET_KEY is short. Use a long random value (at least 32 characters) before deploying.');
}

require('./config/connect');

const boardRoute = require('./routes/board');
const clientRoute = require('./routes/client');
const userRoute = require('./routes/user');
const projectRoute = require('./routes/project');
const { createAdminAccount } = require('./controllers/user');
const { isDemoMode, seedDemo } = require('./demo/demo-data');

const app = express();
const PORT = process.env.PORT || 3000;

// behind a hosting proxy (Render, Railway, Nginx...) this gives the real visitor IP to the login limiter
if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
}

// ---------- security headers ----------
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"]
        }
    },
    // uploaded images are shown by the frontend, which may run on another origin during development
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ---------- CORS: only the frontend's own address may call the API ----------
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200,http://127.0.0.1:4200')
    .split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, done) => {
        // same-origin requests and tools without an Origin header are allowed
        if (!origin || allowedOrigins.includes(origin)) return done(null, true);
        done(null, false);
    }
}));

app.use(express.json({ limit: '1mb' }));

// ---------- API ----------
app.use('/board', boardRoute);
app.use('/client', clientRoute);
app.use('/user', userRoute);
app.use('/project', projectRoute);

app.use('/files', express.static(path.join(__dirname, 'uploads'), {
    index: false,
    setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff')
}));

// ---------- frontend (production): serve the built Angular app from the same server ----------
const frontendDir = path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'browser');
const API_PREFIXES = ['/board', '/client', '/user', '/project', '/files'];

if (fs.existsSync(path.join(frontendDir, 'index.html'))) {
    app.use(express.static(frontendDir, { index: false }));
    app.get('*', (req, res, next) => {
        if (API_PREFIXES.some((p) => req.path === p || req.path.startsWith(p + '/'))) return next();
        res.sendFile(path.join(frontendDir, 'index.html'));
    });
    console.log('serving the frontend from ' + frontendDir);
}

// ---------- errors ----------
app.use((req, res) => {
    res.status(404).send({ message: 'not found' });
});

app.use((err, req, res, next) => {
    // upload errors (file too large, wrong type...) and bad JSON
    if (err && (err.name === 'MulterError' || err.status === 400 || err.type === 'entity.parse.failed')) {
        return res.status(400).send({ message: err.message });
    }
    console.log(err);
    res.status(500).send({ message: 'server error' });
});

app.listen(PORT, ()=>{
    console.log('server work (port ' + PORT + ')');

    // Public demo (DEMO_MODE=true): reload the demo data on every start, so the demo cleans itself up.
    if (isDemoMode()) {
        seedDemo()
            .catch((err) => console.log('demo data failed:', err.message))
            .finally(createAdminAccount);
    } else {
        createAdminAccount();
    }
})
