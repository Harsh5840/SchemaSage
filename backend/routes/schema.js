// routes/schemas.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateUser } from '../middleware/auth';

const schemaRouter = Router();

schemaRouter.get('/schemas/:projectId', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const projectId = req.params.projectId;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        schemas: {
          select: {
            id: true,
            name: true,
            updatedAt: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ schemas: project.schemas });
  } catch (err) {
    console.error('Schema error:', err);
    res.status(500).json({ error: 'Failed to load schemas' });
  }
});

export default schemaRouter;
