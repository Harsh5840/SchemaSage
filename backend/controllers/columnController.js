
import { prisma } from '../prisma/client.js'; // Adjust the path if needed
import { Request, Response } from 'express';

const columnController = {
  // Create a new column within a table
  async createColumn(req: Request, res: Response) {
    try {
      const { tableId, name, type, isPrimary, isNullable, isUnique, defaultValue } =
        req.body;
      const userId = req.user.id;

      // 1. Validate input
      if (!tableId || !name || !type) {
        return res.status(400).json({
          error: 'Table ID, column name, and column type are required',
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

      // 3. Create the new column
      const newColumn = await prisma.column.create({
        data: {
          name,
          type,
          isPrimary: isPrimary || false,
          isNullable: isNullable || false,
          isUnique: isUnique || false,
          defaultValue,
          tableId,
        },
      });

      // 4. Return the newly created column
      return res.status(201).json(newColumn);
    } catch (error) {
      console.error('Error creating column:', error);
      return res
        .status(500)
        .json({ error: 'Failed to create column', details: error });
    }
  },

  // Get all columns for a table
  async getColumnsByTable(req: Request, res: Response) {
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

      // 3. Fetch all columns for the table
      const columns = await prisma.column.findMany({
        where: { tableId },
      });

      // 4. Return the columns
      return res.status(200).json(columns);
    } catch (error) {
      console.error('Error fetching columns:', error);
      return res
        .status(500)
        .json({ error: 'Failed to fetch columns', details: error });
    }
  },

    // Get a specific column
    async getColumn(req: Request, res: Response) {
      try {
        const { columnId } = req.params;
        const userId = req.user.id;
  
        // 1. Validate input
        if (!columnId) {
          return res.status(400).json({ error: 'Column ID is required' });
        }
  
        // 2. Verify that the user is a member of the project's workspace.
        const column = await prisma.column.findUnique({
          where: { id: columnId },
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
  
        if (!column) {
          return res.status(404).json({ error: 'Column not found' });
        }
  
        const isMember = column.table.schema.project.workspace.members.some(m => m.userId === userId);
        if (!isMember) {
          return res.status(403).json({ error: "Unauthorized" });
        }
  
        // 3. Fetch the column
        const fetchedColumn = await prisma.column.findUnique({
          where: { id: columnId },
        });
  
        // 4. Return the column
        return res.status(200).json(fetchedColumn);
      } catch (error) {
        console.error('Error fetching column:', error);
        return res
          .status(500)
          .json({ error: 'Failed to fetch column', details: error });
      }
    },

  // Update a column
  async updateColumn(req: Request, res: Response) {
    try {
      const { columnId } = req.params;
      const { name, type, isPrimary, isNullable, isUnique, defaultValue } =
        req.body;
        const userId = req.user.id;

      // 1. Validate input
      if (!columnId || (!name && !type && isPrimary === undefined && isNullable === undefined && isUnique === undefined && defaultValue === undefined)) {
        return res.status(400).json({
          error: 'Column ID and at least one field to update are required',
        });
      }

      // 2. Verify that the user is a member of the project's workspace.
      const column = await prisma.column.findUnique({
        where: { id: columnId },
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

      if (!column) {
        return res.status(404).json({ error: 'Column not found' });
      }

      const isMember = column.table.schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Update the column
      const updatedColumn = await prisma.column.update({
        where: { id: columnId },
        data: {
          name,
          type,
          isPrimary,
          isNullable,
          isUnique,
          defaultValue,
        },
      });

      // 4. Return the updated column
      return res.status(200).json(updatedColumn);
    } catch (error) {
      console.error('Error updating column:', error);
      return res
        .status(500)
        .json({ error: 'Failed to update column', details: error });
    }
  },

  // Delete a column
  async deleteColumn(req: Request, res: Response) {
    try {
      const { columnId } = req.params;
      const userId = req.user.id;

      // 1. Validate input
      if (!columnId) {
        return res.status(400).json({ error: 'Column ID is required' });
      }

      // 2. Verify that the user is a member of the project's workspace.
      const column = await prisma.column.findUnique({
        where: { id: columnId },
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

      if (!column) {
        return res.status(404).json({ error: 'Column not found' });
      }

      const isMember = column.table.schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Delete the column
      await prisma.column.delete({
        where: { id: columnId },
      });

      // 4. Return a success message
      return res.status(200).json({ message: 'Column deleted successfully' });
    } catch (error) {
      console.error('Error deleting column:', error);
      return res
        .status(500)
        .json({ error: 'Failed to delete column', details: error });
    }
  },
};

export default columnController;