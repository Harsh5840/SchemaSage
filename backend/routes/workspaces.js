import express from "express";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/authOptions.js";
import { prisma } from "../../../prisma/client.js";

const router = express.Router();

// POST /api/dashboard/workspaces
router.post("/", async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Workspace name is required" });

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    res.status(201).json(workspace);
  } catch (err) {
    console.error("Create Workspace Error:", err);
    res.status(500).json({ error: "Failed to create workspace" });
  }
});

export default router;
