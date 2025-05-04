import { prisma } from '../prisma/client.js'; // Adjust the path if needed
import { Request, Response } from 'express';

const commentController = {
  // Create a new comment on a table
  async createComment(req: Request, res: Response) {
    try {
      const { tableId, content } = req.body;
      const userId = req.user.id;

      // 1. Validate input
      if (!tableId || !content) {
        return res.status(400).json({
          error: 'Table ID and Content are required',
        });
      }

      // 2. Verify that the user is a member of the project's workspace.
      const table = await prisma.table.findUnique({
        where: { id: tableId },
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

      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }

      const isMember = table.schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Create the new comment
      const newComment = await prisma.comment.create({
        data: {
          tableId,
          content,
          userId,
        },
      });

      // 4. Return the newly created comment
      return res.status(201).json(newComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      return res
        .status(500)
        .json({ error: 'Failed to create comment', details: error });
    }
  },

  // Get all comments for a table
  async getCommentsByTable(req: Request, res: Response) {
    try {
      const { tableId } = req.params;
      const userId = req.user.id;

      // 1. Validate input
      if (!tableId) {
        return res.status(400).json({ error: 'Table ID is required' });
      }

      // 2. Verify that the user is a member of the project's workspace.
      const table = await prisma.table.findUnique({
        where: { id: tableId },
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

      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }

      const isMember = table.schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Fetch all comments for the table
      const comments = await prisma.comment.findMany({
        where: { tableId },
        include: { user: true }
      });

      // 4. Return the comments
      return res.status(200).json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return res
        .status(500)
        .json({ error: 'Failed to fetch comments', details: error });
    }
  },

    // Get a specific comment
    async getComment(req: Request, res: Response) {
      try {
        const { commentId } = req.params;
        const userId = req.user.id;
  
        // 1. Validate input
        if (!commentId) {
          return res.status(400).json({ error: 'Comment ID is required' });
        }
  
        // 2. Verify that the user is a member of the project's workspace.
        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          include: {
            table: {
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
            }
          }
        });
  
        if (!comment) {
          return res.status(404).json({ error: 'Comment not found' });
        }
  
        const isMember = comment.table.schema.project.workspace.members.some(m => m.userId === userId);
        if (!isMember) {
          return res.status(403).json({ error: "Unauthorized" });
        }
  
        // 3. Fetch the comment
        const fetchedComment = await prisma.comment.findUnique({
          where: { id: commentId },
          include: { user: true }
        });
  
        // 4. Return the comment
        return res.status(200).json(fetchedComment);
      } catch (error) {
        console.error('Error fetching comment:', error);
        return res
          .status(500)
          .json({ error: 'Failed to fetch comment', details: error });
      }
    },

  // Delete a comment
  async deleteComment(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;

      // 1. Validate input
      if (!commentId) {
        return res.status(400).json({ error: 'Comment ID is required' });
      }

      // 2. Verify that the user is a member of the project's workspace.
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          table: {
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
          }
        }
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      const isMember = comment.table.schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Delete the comment
      await prisma.comment.delete({
        where: { id: commentId },
      });

      // 4. Return a success message
      return res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      return res
        .status(500)
        .json({ error: 'Failed to delete comment', details: error });
    }
  },
};

export default commentController;