import { prisma } from '../prisma/client.js'; // Adjust the path if needed
import { Request, Response } from 'express';

const collaborationController = {
  // Start a new collaboration session
  async startSession(req: Request, res: Response) {
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

      // 3. Create the new collaboration session
      const newSession = await prisma.collabSession.create({
        data: {
          schemaId,
          userId,
          lastActive: new Date()
        },
      });

      // 4. Return the newly created session
      return res.status(201).json(newSession);
    } catch (error) {
      console.error('Error starting session:', error);
      return res
        .status(500)
        .json({ error: 'Failed to start session', details: error });
    }
  },

  // Join an existing collaboration session
  async joinSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // 1. Validate input
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      // 2. Fetch the session
      const session = await prisma.collabSession.findUnique({
        where: { id: sessionId },
        include: {
          schema: {
            include: {
              project: {
                include: {
                  workspace: {
                    include: { members: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // 3. Verify that the user is a member of the project's workspace.
      const isMember = session.schema.project.workspace.members.some(m => m.userId=== userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 4. Update the session with the joining user
      const updatedSession = await prisma.collabSession.update({
        where: { id: sessionId },
        data: {
          userId: userId,
          joinedAt: new Date(),
          lastActive: new Date()
        },
      });

      // 5. Return the updated session
      return res.status(200).json(updatedSession);
    } catch (error) {
      console.error('Error joining session:', error);
      return res
        .status(500)
        .json({ error: 'Failed to join session', details: error });
    }
  },

  // Update cursor position
  async updateCursor(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { x, y, color } = req.body;
      const userId = req.user.id;

      // 1. Validate input
      if (sessionId === undefined || x === undefined || y === undefined || !color) { //sessionId can be zero
        return res.status(400).json({
          error: 'Session ID, X, Y, and Color are required',
        });
      }

       // 2. Verify that the user is part of the collaboration session.
       const session = await prisma.collabSession.findUnique({
        where: { id: sessionId },
        include: {
          schema: {
            include: {
              project: {
                include: {
                  workspace: {
                    include: { members: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const isMember = session.schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Update or create the cursor position
      const existingCursor = await prisma.cursorPosition.findFirst({
        where: { sessionId },
      });

      let updatedCursor;
      if (existingCursor) {
        updatedCursor = await prisma.cursorPosition.update({
          where: { id: existingCursor.id },
          data: { x, y, color, updatedAt: new Date() },
        });
      } else {
        updatedCursor = await prisma.cursorPosition.create({
          data: { sessionId, x, y, color, updatedAt: new Date() },
        });
      }

      // 4. Return the updated cursor position
      return res.status(200).json(updatedCursor);
    } catch (error) {
      console.error('Error updating cursor position:', error);
      return res
        .status(500)
        .json({ error: 'Failed to update cursor position', details: error });
    }
  },

  // Get session information
    async getSession(req: Request, res: Response) {
      try {
        const { sessionId } = req.params;
        const userId = req.user.id;
  
        // 1. Validate input
        if (!sessionId) {
          return res.status(400).json({ error: 'Session ID is required' });
        }
  
        // 2. Verify that the user is part of the collaboration session.
        const session = await prisma.collabSession.findUnique({
          where: { id: sessionId },
          include: {
            schema: {
              include: {
                project: {
                  include: {
                    workspace: {
                      include: { members: true }
                    }
                  }
                }
              }
            }
          }
        });
  
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }
  
        const isMember = session.schema.project.workspace.members.some(m => m.userId === userId);
        if (!isMember) {
          return res.status(403).json({ error: "Unauthorized" });
        }
  
        // 3. Fetch the session information, including users and their cursors
        const sessionData = await prisma.collabSession.findUnique({
          where: { id: sessionId },
          include: {
            users: true, //  Include users in the session
            cursors: true, // Include cursor positions
          },
        });
  
        if (!sessionData) {
          return res.status(404).json({ error: 'Session not found' });
        }
  
        // 4. Return the session data
        return res.status(200).json(sessionData);
      } catch (error) {
        console.error('Error fetching session information:', error);
        return res
          .status(500)
          .json({ error: 'Failed to fetch session information', details: error });
      }
    },

  // Leave a collaboration session
  async leaveSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // 1. Validate input
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      // 2. Verify that the user is part of the collaboration session.
      const session = await prisma.collabSession.findUnique({
        where: { id: sessionId },
        include: {
          schema: {
            include: {
              project: {
                include: {
                  workspace: {
                    include: { members: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const isMember = session.schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Remove the user from the session (either by deleting the session or updating it)
      //    Option A: Delete the entire session if only one user
      //    Option B:  Remove the user from the session.  (More complex, depends on your model)
      await prisma.collabSession.delete({
        where: { id: sessionId, userId: userId }, // Ensure we only delete for the correct user.
      });

      // 4. Return a success message
      return res.status(200).json({ message: 'Left session successfully' });
    } catch (error) {
      console.error('Error leaving session:', error);
      return res
        .status(500)
        .json({ error: 'Failed to leave session', details: error });
    }
  },
};

export default collaborationController;
