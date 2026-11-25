// Demo mode for the public portfolio version of Amine GRH.
// Everything here only runs when DEMO_MODE=true. All people, companies and emails are fictional.
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Client = require('../models/client');
const Project = require('../models/project');
const Board = require('../models/board');

const isDemoMode = () => process.env.DEMO_MODE === 'true';

// The two public demo logins shown on the login page.
const DEMO_PASSWORD = 'Demo@2026';
const DEMO_ACCOUNTS = [
    { role: 'Admin', email: 'admin@aminegrh.demo', password: DEMO_PASSWORD },
    { role: 'Employee', email: 'employee@aminegrh.demo', password: DEMO_PASSWORD }
];

// demo logins cannot have their email/password changed, or be deleted, so visitors can't lock others out
const isProtectedDemoAccount = (user) =>
    isDemoMode() && !!user && DEMO_ACCOUNTS.some((a) => a.email === String(user.email).toLowerCase());

const EMPLOYEES = [
    { key: 'yasmine', fullname: 'Yasmine Ben Ali', email: 'employee@aminegrh.demo', tel: '+216 20 111 222', tags: ['Angular', 'UI/UX'] },
    { key: 'karim', fullname: 'Karim Haddad', email: 'karim.haddad@aminegrh.demo', tel: '+216 22 333 444', tags: ['Node.js', 'MongoDB'] },
    { key: 'ines', fullname: 'Ines Trabelsi', email: 'ines.trabelsi@aminegrh.demo', tel: '+216 24 555 666', tags: ['Project Manager', 'Scrum'] },
    { key: 'omar', fullname: 'Omar Jlassi', email: 'omar.jlassi@aminegrh.demo', tel: '+216 25 777 888', tags: ['DevOps', 'Docker'] },
    { key: 'leila', fullname: 'Leila Mansour', email: 'leila.mansour@aminegrh.demo', tel: '+216 26 999 000', tags: ['QA', 'Testing'] }
];

const CLIENTS = [
    { key: 'carthage', fullname: 'Carthage Retail', email: 'contact@carthage-retail.example', address: 'Tunis, Tunisia', tel: '+216 71 100 200' },
    { key: 'atlas', fullname: 'Atlas Logistics', email: 'hello@atlas-logistics.example', address: 'Sfax, Tunisia', tel: '+216 74 300 400' },
    { key: 'medina', fullname: 'Medina Health', email: 'info@medina-health.example', address: 'Sousse, Tunisia', tel: '+216 73 500 600' },
    { key: 'nova', fullname: 'Nova Fintech', email: 'team@nova-fintech.example', address: 'Paris, France', tel: '+33 1 23 45 67 89' }
];

const task = (text, status, date, budget) => ({ text, status, date, budget: String(budget) });

const PROJECTS = [
    {
        name: 'E-commerce platform redesign', client: 'carthage', status: 'pending', budget: 18000,
        startDate: '2026-09-01', endDate: '2027-01-15', team: ['yasmine', 'karim', 'leila'],
        description: 'New responsive online shop with a faster checkout, product search and an admin back office.',
        board: {
            backlog: [task('Product search filters', 'backlog', '2026-12-10', 900), task('Wishlist page', 'backlog', '2026-12-20', 600)],
            inprogress: [task('Checkout flow', 'inprogress', '2026-12-01', 1500), task('Responsive product page', 'inprogress', '2026-11-30', 800)],
            completed: [task('Design system & mockups', 'completed', '2026-10-05', 1200), task('Catalog API', 'completed', '2026-10-25', 1400)],
            inhold: [task('Payment provider integration', 'inhold', '2026-12-15', 1100)]
        }
    },
    {
        name: 'Fleet tracking dashboard', client: 'atlas', status: 'completed', budget: 12500,
        startDate: '2026-03-01', endDate: '2026-07-30', team: ['karim', 'omar'],
        description: 'Real-time map of delivery trucks with route history, alerts and monthly reports.',
        board: {
            backlog: [],
            inprogress: [],
            completed: [task('GPS data ingestion', 'completed', '2026-04-10', 2000), task('Live map view', 'completed', '2026-05-20', 1800), task('PDF monthly reports', 'completed', '2026-07-15', 900)],
            inhold: []
        }
    },
    {
        name: 'Patient booking app', client: 'medina', status: 'delay', budget: 22000,
        startDate: '2026-06-15', endDate: '2026-11-30', team: ['yasmine', 'ines', 'leila'],
        description: 'Online appointment booking for clinics, with SMS reminders and a doctor calendar.',
        board: {
            backlog: [task('SMS reminders', 'backlog', '2026-12-05', 700)],
            inprogress: [task('Doctor calendar', 'inprogress', '2026-11-28', 1600)],
            completed: [task('Patient sign-up', 'completed', '2026-08-01', 900), task('Clinic listing', 'completed', '2026-09-10', 1100)],
            inhold: [task('Insurance verification', 'inhold', '2026-12-20', 1300)]
        }
    },
    {
        name: 'Mobile banking API', client: 'nova', status: 'pending', budget: 30000,
        startDate: '2026-10-01', endDate: '2027-03-31', team: ['karim', 'omar', 'ines'],
        description: 'Secure REST API for a mobile banking app: accounts, transfers and notifications.',
        board: {
            backlog: [task('Push notifications', 'backlog', '2027-01-20', 1200), task('Statements export', 'backlog', '2027-02-10', 800)],
            inprogress: [task('Accounts & balances endpoints', 'inprogress', '2026-12-05', 2500)],
            completed: [task('Architecture & threat model', 'completed', '2026-10-20', 1500)],
            inhold: []
        }
    }
];

// Wipes users, clients, projects and boards, then inserts the demo data.
// Refuses to run outside demo mode, so a real database can never be wiped by accident.
const seedDemo = async () => {
    if (!isDemoMode()) {
        throw new Error('seedDemo refused: DEMO_MODE is not "true"');
    }

    await Promise.all([User.deleteMany({}), Client.deleteMany({}), Project.deleteMany({}), Board.deleteMany({})]);

    const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    const now = new Date();

    await User.create({
        fullname: 'Demo Admin', email: DEMO_ACCOUNTS[0].email, password: hash, tel: '+216 70 000 000',
        image: 'admin.png', tags: ['Administrator'], role: 'admin', date: now
    });

    const users = {};
    for (const e of EMPLOYEES) {
        users[e.key] = await User.create({
            fullname: e.fullname, email: e.email, password: hash, tel: e.tel,
            image: '', tags: e.tags, role: 'user', date: now
        });
    }

    const clients = {};
    for (const c of CLIENTS) {
        clients[c.key] = await Client.create({
            fullname: c.fullname, email: c.email, address: c.address, tel: c.tel, image: '', date: now
        });
    }

    for (const p of PROJECTS) {
        const project = await Project.create({
            name: p.name, description: p.description, startDate: p.startDate, endDate: p.endDate,
            budget: p.budget, status: p.status, client: clients[p.client]._id,
            team: p.team.map((k) => users[k]._id), files: [], date: now
        });
        await Board.create({ project: project._id, date: now, ...p.board });
    }

    console.log('demo data loaded: 1 admin, ' + EMPLOYEES.length + ' employees, ' + CLIENTS.length + ' clients, ' + PROJECTS.length + ' projects');
};

module.exports = { isDemoMode, seedDemo, DEMO_ACCOUNTS, isProtectedDemoAccount };
