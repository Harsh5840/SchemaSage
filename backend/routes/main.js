import express from 'express';

const mainrouter = express.Router();

import authRouter from './auth.js';

mainrouter.post('/auth', authRouter);


export default mainrouter;