const Project = require('../models/project');
const Board = require('../models/board');
const { createBoard } = require('./board');

// team members are shown without their password hash or role
const TEAM_FIELDS = 'fullname email tel image tags';

const text = (value) => (typeof value === 'string' ? value.trim() : undefined);

const parseTeam = (value) => {
    try {
        const team = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(team) ? team.filter((id) => typeof id === 'string') : [];
    } catch (e) {
        return [];
    }
}

// only these fields can be set from a request
const pick = (body) => {
    let data = {};
    ['name', 'description', 'startDate', 'endDate', 'status'].forEach((key) => {
        const value = text(body[key]);
        if (value !== undefined) data[key] = value;
    });
    if (body.budget !== undefined && body.budget !== '') {
        const budget = Number(body.budget);
        if (!Number.isNaN(budget)) data.budget = budget;
    }
    if (typeof body.client === 'string' && body.client) {
        data.client = body.client;
    }
    if (body.team !== undefined) {
        data.team = parseTeam(body.team);
    }
    return data;
}

const sendError = (res, error) => {
    if (error && (error.name === 'CastError' || error.name === 'ValidationError')) {
        return res.status(400).send({ message: 'invalid data' });
    }
    console.log(error);
    res.status(500).send({ message: 'server error' });
}

const create = async (req, res, fileNames)=>{
    try {
        let data = pick(req.body);
        if (!data.name) {
            return res.status(400).send({ message: 'project name is required' });
        }
        let project = new Project(data);
        project.files = fileNames;
        project.date = new Date();
        let result = await project.save();
        createBoard(result._id);
        res.status(201).send(result);
    } catch (error) {
        sendError(res, error);
    }
}

const list = async (req, res)=>{
    try {
        let projects = await Project.find()
            .populate({ path: 'client', model: 'Client' })
            .populate({ path: 'team', model: 'User', select: TEAM_FIELDS })
            .exec()
        res.status(200).send(projects);
    } catch (error) {
        sendError(res, error);
    }
}

const preview = async (req, res)=>{
    try {
        let project = await Project.findById({_id: req.params.id})
            .populate({ path: 'client', model: 'Client' })
            .populate({ path: 'team', model: 'User', select: TEAM_FIELDS })
            .exec()
        if (!project) {
            return res.status(404).send({ message: 'project not found' });
        }
        res.status(200).send(project);
    } catch (error) {
        sendError(res, error);
    }
}

const byId = async (req, res)=>{
    try {
        let project = await Project.findById({_id: req.params.id});
        if (!project) {
            return res.status(404).send({ message: 'project not found' });
        }
        res.status(200).send(project);
    } catch (error) {
        sendError(res, error);
    }
}

const deleteProject = async (req, res)=>{
    try {
        let deletedProject = await Project.findByIdAndDelete({_id: req.params.id});
        if (!deletedProject) {
            return res.status(404).send({ message: 'project not found' });
        }
        await Board.deleteMany({ project: deletedProject._id });
        res.status(200).send(deletedProject);
    } catch (error) {
        sendError(res, error);
    }
}

const update = async (req, res, fileNames)=>{
    try {
        let data = pick(req.body);
        if (data.name === '') {
            return res.status(400).send({ message: 'project name is required' });
        }
        if(fileNames.length > 0){
            data.files = fileNames;
        }
        let updatedProject = await Project.findByIdAndUpdate({ _id: req.params.id }, data, { new: true });
        if (!updatedProject) {
            return res.status(404).send({ message: 'project not found' });
        }
        res.status(200).send(updatedProject);
    } catch (error) {
        sendError(res, error);
    }
}

module.exports = { create, list, byId, preview, deleteProject, update };
