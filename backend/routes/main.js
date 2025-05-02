import express from 'express';

const mainrouter = express.Router();

import authRouter from './auth.js';

mainrouter.use('/auth', authRouter);


export default mainrouter;