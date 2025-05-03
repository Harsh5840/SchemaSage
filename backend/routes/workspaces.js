// routes/workspaces.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/workspaces', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
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

    res.json({ workspaces });
  } catch (err) {
    console.error('Workspace error:', err);
    res.status(500).json({ error: 'Failed to load workspaces' });
  }
});

export default router;
