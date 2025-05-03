// routes/projects.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../middleware/authMiddleware';

const projectRouter = Router();

projectRouter.get('/projects/:workspaceId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const workspaceId = req.params.workspaceId;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        projects: {
          select: {
            id: true,
            name: true,
            schemas: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Ensure user is a member of the workspace
    const isMember = workspace.members.some(member => member.userId === userId);

    if (!isMember && workspace.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ workspace });
  } catch (err) {
    console.error('Project error:', err);
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

export default projectRouter;
