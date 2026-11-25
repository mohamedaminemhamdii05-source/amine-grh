const Board = require('../models/board');
const Project = require('../models/project');

const COLUMNS = ['backlog', 'inprogress', 'completed', 'inhold'];

const sendError = (res, error) => {
    if (error && error.name === 'CastError') {
        return res.status(400).send({ message: 'invalid id' });
    }
    console.log(error);
    res.status(500).send({ message: 'server error' });
}

const createBoard = (id)=>{
    let board = new Board();
    board.project = id;
    board.date = new Date();
    board.save()
        .catch((err)=>{ console.log(err); })
}

// :id is the project id
const byId = async (req, res)=>{
    try {
        let board = await Board.findOne({ project: req.params.id });
        if (!board) {
            return res.status(404).send({ message: 'board not found' });
        }
        res.status(200).send(board);
    } catch (error) {
        sendError(res, error);
    }
}

const deleteBoard = async (req, res)=>{
    try {
        let board = await Board.findByIdAndDelete({ _id: req.params.id });
        if (!board) {
            return res.status(404).send({ message: 'board not found' });
        }
        res.status(200).send(board);
    } catch (error) {
        sendError(res, error);
    }
}

// :id is the board id. Admins, or members of the project's team, can move/add tasks.
const update = async (req, res)=>{
    try {
        let board = await Board.findById({ _id: req.params.id });
        if (!board) {
            return res.status(404).send({ message: 'board not found' });
        }

        if (req.user.role !== 'admin') {
            const project = await Project.findById(board.project).select('team');
            const isMember = project && project.team.some((member) => String(member) === req.user._id);
            if (!isMember) {
                return res.status(403).send({ message: 'only the project team can change this board' });
            }
        }

        // only the four task columns can be changed
        let data = {};
        COLUMNS.forEach((column) => {
            if (Array.isArray(req.body[column])) {
                data[column] = req.body[column];
            }
        });

        let updated = await Board.findByIdAndUpdate({ _id: board._id }, data, { new: true });
        res.status(200).send(updated);
    } catch (error) {
        sendError(res, error);
    }
}

module.exports = { createBoard, byId, deleteBoard, update };
