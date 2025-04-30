const authrouter = require('./auth');

const mainrouter = require('express').Router();
//route to all the important pages

mainrouter.post('/auth', authrouter);
module.exports = mainrouter;