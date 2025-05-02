import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { generateToken } from "../utils/jwtUtils.js"; // Placeholder for JWT token generation

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
    console.log(req.body);

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
authRouter.post("/oauth", async (req, res) => {
  const { email, name, provider } = req.body;

  if (!email || !provider) {
    return res.status(400).json({ message: "Missing required user data" });
  }

  try {
    // Check if the user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Update user data if exists
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          provider, // Update provider if needed
        },
      });
    } else {
      // Create a new user without password (for OAuth users)
      user = await prisma.user.create({
        data: {
          email,
          name,
          provider,
        },
      });
    }

    res.status(200).json({ message: "User data stored successfully", user });
  } catch (error) {
    console.error("Error saving user data:", error);
    res.status(500).json({ message: "Failed to store user data" });
  }
});


export default authRouter;
