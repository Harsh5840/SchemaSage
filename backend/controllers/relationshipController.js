import { prisma } from '../prisma/client.js'; // Adjust the path if needed
import { Request, Response } from 'express';

const relationshipController = {
  // Create a new relationship
  async createRelationship(req: Request, res: Response) {
    try {
      const { fromTableId, toTableId, fromColumn, toColumn, type } = req.body;
      const userId = req.user.id;

      // 1. Validate input
      if (!fromTableId || !toTableId || !fromColumn || !toColumn || !type) {
        return res.status(400).json({
          error:
            'From Table ID, To Table ID, From Column, To Column, and Relationship Type are required',
        });
      }

      // 2. Verify that the user is a member of the project's workspace.
      const fromTable = await prisma.table.findUnique({
        where: { id: fromTableId },
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

      const toTable = await prisma.table.findUnique({
        where: { id: toTableId },
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

      if (!fromTable || !toTable) {
        return res.status(404).json({ error: 'One or both tables not found' });
      }

      if (fromTable.schemaId !== toTable.schemaId) {
        return res.status(400).json({ error: 'Tables must be in the same schema' });
      }


      const isMember = fromTable.schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Create the new relationship
      const newRelationship = await prisma.relationship.create({
        data: {
          fromTableId,
          toTableId,
          fromColumn,
          toColumn,
          type,
        },
      });

      // 4. Return the newly created relationship
      return res.status(201).json(newRelationship);
    } catch (error) {
      console.error('Error creating relationship:', error);
      return res
        .status(500)
        .json({ error: 'Failed to create relationship', details: error });
    }
  },

  // Get all relationships for a schema
  async getRelationshipsBySchema(req: Request, res: Response) {
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

      // 3. Fetch all relationships for the schema
      const relationships = await prisma.relationship.findMany({
        where: {
          OR: [
            { fromTable: { schemaId } },
            { toTable: { schemaId } },
          ],
        },
        include: {
          fromTable: true,
          toTable: true
        }
      });

      // 4. Return the relationships
      return res.status(200).json(relationships);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      return res
        .status(500)
        .json({ error: 'Failed to fetch relationships', details: error });
    }
  },

    // Get a specific relationship
    async getRelationship(req: Request, res: Response) {
      try {
        const { relationshipId } = req.params;
        const userId = req.user.id;
  
        // 1. Validate input
        if (!relationshipId) {
          return res.status(400).json({ error: 'Relationship ID is required' });
        }
  
        // 2. Verify that the user is a member of the project's workspace.
        const relationship = await prisma.relationship.findUnique({
          where: { id: relationshipId },
          include: {
            fromTable: {
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
            },
            toTable: {
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
  
        if (!relationship) {
          return res.status(404).json({ error: 'Relationship not found' });
        }
  
        const isMember = relationship.fromTable.schema.project.workspace.members.some(m => m.userId === userId) || relationship.toTable.schema.project.workspace.members.some(m => m.userId === userId);
        if (!isMember) {
          return res.status(403).json({ error: "Unauthorized" });
        }
  
        // 3. Return the relationship
        return res.status(200).json(relationship);
      } catch (error) {
        console.error('Error fetching relationship:', error);
        return res
          .status(500)
          .json({ error: 'Failed to fetch relationship', details: error });
      }
    },

  // Update a relationship
  async updateRelationship(req: Request, res: Response) {
    try {
      const { relationshipId } = req.params;
      const { fromTableId, toTableId, fromColumn, toColumn, type } = req.body;
      const userId = req.user.id;

      // 1. Validate input
      if (!relationshipId || (!fromTableId && !toTableId && !fromColumn && !toColumn && !type)) {
        return res.status(400).json({
          error:
            'Relationship ID and at least one field to update are required',
        });
      }

      // 2. Verify that the user is a member of the project's workspace.
      const relationship = await prisma.relationship.findUnique({
        where: { id: relationshipId },
        include: {
          fromTable: {
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
          },
          toTable: {
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

      if (!relationship) {
        return res.status(404).json({ error: 'Relationship not found' });
      }

      const isMember = relationship.fromTable.schema.project.workspace.members.some(m => m.userId === userId) || relationship.toTable.schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Update the relationship
      const updatedRelationship = await prisma.relationship.update({
        where: { id: relationshipId },
        data: {
          fromTableId,
          toTableId,
          fromColumn,
          toColumn,
          type,
        },
      });

      // 4. Return the updated relationship
      return res.status(200).json(updatedRelationship);
    } catch (error) {
      console.error('Error updating relationship:', error);
      return res
        .status(500)
        .json({ error: 'Failed to update relationship', details: error });
    }
  },

  // Delete a relationship
  async deleteRelationship(req: Request, res: Response) {
    try {
      const { relationshipId } = req.params;
      const userId = req.user.id;

      // 1. Validate input
      if (!relationshipId) {
        return res.status(400).json({ error: 'Relationship ID is required' });
      }

      // 2. Verify that the user is a member of the project's workspace.
      const relationship = await prisma.relationship.findUnique({
        where: { id: relationshipId },
        include: {
          fromTable: {
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
          },
          toTable: {
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

      if (!relationship) {
        return res.status(404).json({ error: 'Relationship not found' });
      }

      const isMember = relationship.fromTable.schema.project.workspace.members.some(m => m.userId === userId) || relationship.toTable.schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Delete the relationship
      await prisma.relationship.delete({
        where: { id: relationshipId },
      });

      // 4. Return a success message
      return res.status(200).json({ message: 'Relationship deleted successfully' });
    } catch (error) {
      console.error('Error deleting relationship:', error);
      return res
        .status(500)
        .json({ error: 'Failed to delete relationship', details: error });
    }
  },
};

export default relationshipController;
