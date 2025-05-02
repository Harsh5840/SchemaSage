const authrouter = require('express').Router();
import {PrismaClient} from "@prisma/client";
const prisma = new PrismaClient;


authrouter.post('/login', (req,res)=>{
    //login logic here
});

authrouter.post('/register', (req,res)=>{
    const {email , password} = req.body;
    const user = prisma.user.crea
})


module.exports = authrouter;