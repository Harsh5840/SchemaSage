const authrouter = require('express').Router();
import {PrismaClient} from "@prisma/client";
const prisma = new PrismaClient;
const {z} = require("zod");


authrouter.post('/login', (req,res)=>{
    //login logic here
});

authrouter.post('/register', (req,res)=>{
    const {email , password} = req.body;
    const user = prisma.user.create({
        data:{
            email,
            password
        }
    })
    res.json(user);
})


module.exports = authrouter;