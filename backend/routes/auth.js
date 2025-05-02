import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { generateToken } from './utils'; // Placeholder for JWT token generation

const prisma = new PrismaClient();
const authRouter = Router();

// Zod schema for validation
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register route
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password } = authSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in the database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    res.status(200).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login route
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = authSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password with the stored hashed password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Optionally generate a token here if needed (JWT)
    const token = generateToken(user.id); // Add your token generation logic here

    res.status(200).json({ message: "Login successful", user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// OAuth (Google and GitHub) callback route
authRouter.post('/oauth', async (req, res) => {
  try {
    const { provider, oauthData } = req.body; // { provider: 'google', oauthData: { id, email, name, avatarUrl } }

    if (!oauthData || !oauthData.email) {
      return res.status(400).json({ message: "Invalid OAuth data" });
    }

    // Check if the user already exists via OAuth
    const existingUser = await prisma.user.findUnique({
      where: { email: oauthData.email },
    });

    let user;

    if (existingUser) {
      // User already exists, just update the avatar if provided
      user = await prisma.user.update({
        where: { email: oauthData.email },
        data: {
          avatarUrl: oauthData.avatarUrl,
          name: oauthData.name || existingUser.name,
        },
      });
    } else {
      // Create a new user via OAuth data
      user = await prisma.user.create({
        data: {
          email: oauthData.email,
          name: oauthData.name,
          avatarUrl: oauthData.avatarUrl,
        },
      });
    }

    // Optionally generate a token for the OAuth user
    const token = generateToken(user.id); // Add your token generation logic here

    res.status(200).json({ message: "OAuth login successful", user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = authRouter;
