import { prisma } from '../prisma/client.js'; // Adjust the path if needed
import { Request, Response } from 'express';

const aiController = {
  // Record an AI interaction for a schema
  async recordInteraction(req: Request, res: Response) {
    try {
      const { schemaId } = req.params;
      const { prompt, response } = req.body;
      const userId = req.user.id;

      // 1. Validate input
      if (!schemaId || !prompt || !response) {
        return res
          .status(400)
          .json({ error: 'Schema ID, Prompt, and Response are required' });
      }

      // 2. Verify that the user is a member of the project's workspace.
      const schema = await prisma.schema.findUnique({
        where: { id: schemaId },
        include: {
          project: {
            include: {
              workspace: {
                include: { members: true }
              }
            }
          }
        }
      });

      if (!schema) {
        return res.status(404).json({ error: 'Schema not found' });
      }

      const isMember = schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Create the new AI interaction record
      const newInteraction = await prisma.aIInteraction.create({
        data: {
          schemaId,
          userId,
          prompt,
          response,
        },
      });

      // 4. Return the newly created interaction
      return res.status(201).json(newInteraction);
    } catch (error) {
      console.error('Error recording AI interaction:', error);
      return res
        .status(500)
        .json({ error: 'Failed to record AI interaction', details: error });
    }
  },

  // Get all AI interactions for a schema
  async getInteractionsBySchema(req: Request, res: Response) {
    try {
      const { schemaId } = req.params;
      const userId = req.user.id;

      // 1. Validate input
      if (!schemaId) {
        return res.status(400).json({ error: 'Schema ID is required' });
      }

      // 2. Verify that the user is a member of the project's workspace.
      const schema = await prisma.schema.findUnique({
        where: { id: schemaId },
        include: {
          project: {
            include: {
              workspace: {
                include: { members: true }
              }
            }
          }
        }
      });

      if (!schema) {
        return res.status(404).json({ error: 'Schema not found' });
      }

      const isMember = schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Fetch all AI interactions for the schema
      const interactions = await prisma.aIInteraction.findMany({
        where: { schemaId },
      });

      // 4. Return the interactions
      return res.status(200).json(interactions);
    } catch (error) {
      console.error('Error fetching AI interactions:', error);
      return res
        .status(500)
        .json({ error: 'Failed to fetch AI interactions', details: error });
    }
  },
};

export default aiController;
