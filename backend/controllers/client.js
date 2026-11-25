const Client = require('../models/client');

const text = (value) => (typeof value === 'string' ? value.trim() : undefined);

// only these fields can be set from a request
const pick = (body) => {
    let data = {};
    ['fullname', 'email', 'address', 'tel'].forEach((key) => {
        const value = text(body[key]);
        if (value !== undefined) data[key] = value;
    });
    return data;
}

const sendError = (res, error) => {
    if (error && error.code === 11000) {
        return res.status(409).send({ message: 'this email is already used by another client' });
    }
    if (error && error.name === 'CastError') {
        return res.status(400).send({ message: 'invalid id' });
    }
    console.log(error);
    res.status(500).send({ message: 'server error' });
}

const create = async (req, res, fileName)=>{
    try {
        let data = pick(req.body);
        if (!data.fullname) {
            return res.status(400).send({ message: 'client name is required' });
        }
        let client = new Client(data);
        client.image = fileName;
        client.date = new Date();
        let result = await client.save();
        res.status(201).send(result);
    } catch (error) {
        sendError(res, error);
    }
}

const list = async (req, res)=>{
    try {
        res.status(200).send(await Client.find());
    } catch (error) {
        sendError(res, error);
    }
}

const byId = async (req, res)=>{
    try {
        let client = await Client.findById({ _id: req.params.id });
        if (!client) {
            return res.status(404).send({ message: 'client not found' });
        }
        res.status(200).send(client);
    } catch (error) {
        sendError(res, error);
    }
}

const deleteClient = async (req, res)=>{
    try {
        let client = await Client.findByIdAndDelete({_id: req.params.id});
        if (!client) {
            return res.status(404).send({ message: 'client not found' });
        }
        res.status(200).send(client);
    } catch (error) {
        sendError(res, error);
    }
}

const update = async (req, res, fileName)=>{
    try {
        let data = pick(req.body);
        if (data.fullname === '') {
            return res.status(400).send({ message: 'client name is required' });
        }
        if(fileName.length>0){
            data.image = fileName;
        }
        let client = await Client.findByIdAndUpdate({_id: req.params.id}, data, { new: true });
        if (!client) {
            return res.status(404).send({ message: 'client not found' });
        }
        res.status(200).send(client);
    } catch (error) {
        sendError(res, error);
    }
}

module.exports = { create, list, byId, deleteClient, update };
