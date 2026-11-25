# Amine GRH

<p align="center">
  <img src="frontend/src/assets/images/logo-amine.svg" alt="Amine GRH logo" width="96">
</p>

**Amine GRH** is a full-stack human resources management (GRH) web application.
An administrator manages employees, clients and projects, and follows activity on a statistics dashboard;
employees sign in to access the projects section.

## Live demo

**[Open the live demo](https://YOUR-RENDER-ADDRESS.onrender.com)** (free hosting: the first load can take up to a minute).

The demo uses fictional data that resets regularly. Use the one-click buttons on the login page, or:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@aminegrh.demo` | `Demo@2026` |
| Employee | `employee@aminegrh.demo` | `Demo@2026` |

How to publish and host it yourself: see [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md).

## Features

- Secure login with JSON Web Tokens (JWT) and hashed passwords (bcrypt)
- Two roles: **admin** and **employee**, with guarded routes
- Employees: create, list, update, delete (with profile photo upload)
- Clients: create, list, update, delete (with photo upload)
- Projects: create, list, preview, update, delete (with file attachments)
- A board is created automatically for each new project
- Statistics dashboard with charts
- A default admin account is created automatically on first start

## Tech stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | Angular 17 (standalone components), TypeScript, Bootstrap 5, ngx-charts, SweetAlert2 |
| Backend  | Node.js, Express 4, Mongoose 8, JWT (jsonwebtoken), bcrypt, Multer (file uploads), CORS, dotenv |
| Database | MongoDB |

## Folder structure

```
project-3/
├── backend/                 REST API
│   ├── config/
│   │   ├── connect.js       MongoDB connection
│   │   └── auth/            JWT middleware
│   ├── controllers/         Business logic (user, client, project, board)
│   ├── models/              Mongoose schemas
│   ├── routes/              Express routes
│   ├── uploads/             Uploaded images and files (served at /files)
│   ├── demo/                Demo data for the public portfolio version
│   ├── seed-demo.js         Loads the demo data (demo database only)
│   ├── .env.example         Environment variables template
│   └── server.js            Entry point (port 3000)
├── frontend/                Angular application
│   └── src/
│       ├── app/
│       │   ├── core/        Services, guards, HTTP interceptor
│       │   ├── pages/       Login, dashboard (statistics, employees, clients, projects), 404
│       │   └── shared/      Layout (header, sidebar, footer)
│       ├── assets/          CSS, JS libraries, images, logo
│       └── index.html
├── render.yaml            Render deployment settings (free demo)
├── DEPLOYMENT-GUIDE.md    Step-by-step: GitHub + free hosting
├── .gitignore
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) **20 LTS** recommended (Angular 17 officially supports Node 18.13+ and 20.9+; newer versions may print warnings)
- npm (comes with Node.js)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on the default port `27017`
- Angular CLI is optional: the commands below use the local copy through `npx`

## Installation

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

Edit `backend/.env` and set your own values (see [Environment variables](#environment-variables)).

### 2. Frontend

```bash
cd frontend
npm install
```

## Running the application

Start MongoDB first (on Windows it usually runs automatically as the "MongoDB" service).

**Terminal 1 - backend** (http://127.0.0.1:3000)

```bash
cd backend
node server.js
```

You should see `server work` and `connected`. On the first start it also prints
`admin created , you can use the application now !`.

**Terminal 2 - frontend** (http://localhost:4200)

```bash
cd frontend
npm start
```

Open http://localhost:4200 and sign in with the `EMAIL` and `PASS` values from `backend/.env`.

### Production mode (one server for everything)

```bash
cd frontend
npx ng build            # builds the website into frontend/dist/frontend/browser
cd ../backend
npm start               # serves the API AND the website on http://localhost:3000
```

When `frontend/dist/frontend/browser` exists, the backend serves the website itself, so in production
you only run **one** program. Open http://localhost:3000.

## Deployment

The app is ready to deploy as **one Node.js service** (backend + built website) plus a **MongoDB database**.

1. **Database:** create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) (or use any MongoDB server)
   and copy its connection string.
2. **Host:** any Node.js host works (Render, Railway, a VPS with PM2/Nginx...). Typical settings:
   - Build command: `cd frontend && npm install && npx ng build && cd ../backend && npm install`
   - Start command: `cd backend && npm start`
   - Node version: 20 LTS
3. **Environment variables on the host** (never upload your `.env` file):
   - `SECRET_KEY`: a new long random value (see below)
   - `MONGO_URI`: your Atlas connection string
   - `EMAIL`, `PASS`, `TEL`: the first admin account
   - `TRUST_PROXY=1`: when the host puts a proxy in front of the app (Render, Railway, Heroku, Nginx)
4. **Uploads:** uploaded photos and files are stored in `backend/uploads`. Choose a host with a
   persistent disk (Render "Disk", Railway "Volume", a VPS), otherwise uploads are lost on each redeploy.
5. **HTTPS:** most hosts provide it automatically; on a VPS use Nginx + Let's Encrypt.

Generate a strong `SECRET_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Changing `SECRET_KEY` logs everybody out once (their old login stops working); they just sign in again.

**Hosting the website separately** (optional): set `apiUrl` in `frontend/src/environments/environment.ts`
to the backend's address, rebuild, and add the website's address to `CORS_ORIGIN` on the backend.

## Security

- Every API route requires a valid login, except sign-in. Admin actions (clients, employees,
  creating/editing/deleting projects) are also checked on the server, not only hidden in the website.
- Employees can only change their own profile and the boards of projects they belong to.
  Nobody can change their own role, and admin accounts cannot be deleted or edited through the API.
- Passwords are hashed with bcrypt and never sent back by the API.
- Logins expire (`JWT_EXPIRES_IN`, default 1 day); a deleted account stops working immediately.
- Sign-in is limited to 10 failed attempts per 15 minutes per IP.
- Uploads: images only for photos (max 5 MB), office documents/images for projects (max 20 MB each),
  each with a random file name. HTML/SVG/script files are refused.
- Security headers (Helmet, Content-Security-Policy), CORS limited to your own website,
  protection against MongoDB operator injection.

## Backups

All data is in MongoDB, and uploaded files are in `backend/uploads`. Back up both regularly.
With the [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools) installed:

```bash
mongodump --uri "mongodb://127.0.0.1:27017/grh75" --out backup-2026-11-25
mongorestore --uri "mongodb://127.0.0.1:27017/grh75" backup-2026-11-25/grh75   # to restore
```

On MongoDB Atlas, backups can be enabled in the cluster settings.

## Environment variables

Defined in `backend/.env` (template: `backend/.env.example`):

| Variable         | Required | Description |
|------------------|----------|-------------|
| `SECRET_KEY`     | yes      | Secret used to sign login tokens. Long random value (32+ characters); the server refuses to start without it |
| `EMAIL`          | first start | Email of the default admin account (used to log in) |
| `PASS`           | first start | Password of the default admin account |
| `TEL`            | no       | Phone number of the default admin account |
| `MONGO_URI`      | no       | MongoDB connection string. Default `mongodb://127.0.0.1:27017/grh75` |
| `PORT`           | no       | Server port. Default `3000` |
| `JWT_EXPIRES_IN` | no       | How long a login stays valid. Default `1d` |
| `CORS_ORIGIN`    | no       | Website addresses allowed to call the API (comma separated). Default: the local dev site |
| `TRUST_PROXY`    | no       | Set to `1` behind a hosting proxy |

The default admin is only created when the database has **no admin yet**. Changing `EMAIL`/`PASS`
later does not update an existing admin by itself. To apply new values to the existing admin,
edit `backend/.env`, then run (from `backend/`):

```bash
node update-admin.js
```

Then log out and log in again with the new email and password.

The frontend's API address is set in `frontend/src/environments/` (`environment.development.ts` for
`npm start`, `environment.ts` for production builds).

## API overview

Access: **public** = no login, **login** = any logged-in user, **admin** = admin only, **self** = your own account.

| Prefix     | Endpoints |
|------------|-----------|
| `/user`    | `POST /signin` (public), `PUT /updateprofile/:id` (self), `GET /byid/:id` (admin or self), `POST /createuseraccount`, `GET /list`, `PUT /update/:id`, `DELETE /delete/:id` (admin) |
| `/client`  | `POST /create`, `GET /list`, `GET /byid/:id`, `PUT /update/:id`, `DELETE /delete/:id` (admin) |
| `/project` | `GET /list`, `GET /preview/:id` (login), `POST /create`, `GET /byid/:id`, `PUT /update/:id`, `DELETE /delete/:id` (admin) |
| `/board`   | `GET /byid/:projectId` (login), `PUT /update/:id` (admin or project team member), `DELETE /delete/:id` (admin) |
| `/files`   | Uploaded files (public, random file names) |

## Author

**Mohamed Amine**: design and development.

© 2026 Mohamed Amine. All rights reserved.
