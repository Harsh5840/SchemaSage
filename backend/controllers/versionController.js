import { prisma } from '../prisma/client.js'; // Adjust the path if needed
import { Request, Response } from 'express';

const versionController = {
  // Create a new version of a schema (snapshot)
  async createSchemaVersion(req: Request, res: Response) {
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

      // 3. Fetch the schema data to create a snapshot
      const schemaData = await prisma.schema.findUnique({
        where: { id: schemaId },
        include: {
          tables: {
            include: {
              columns: true,
              outgoingRelations: true,
              incomingRelations: true
            },
          },
        },
      });

      if (!schemaData) {
        return res.status(404).json({ error: 'Schema data not found' });
      }

      // 4. Serialize the schema data to JSON
      const snapshotJson = JSON.stringify(schemaData);

      // 5. Create the new schema version
      const newVersion = await prisma.schemaVersion.create({
        data: {
          schemaId,
          snapshotJson,
        },
      });

      // 6. Return the newly created version
      return res.status(201).json(newVersion);
    } catch (error) {
      console.error('Error creating schema version:', error);
      return res
        .status(500)
        .json({ error: 'Failed to create schema version', details: error });
    }
  },

  // Get all versions of a schema
  async getSchemaVersions(req: Request, res: Response) {
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

      // 3. Fetch all versions for the schema
      const versions = await prisma.schemaVersion.findMany({
        where: { schemaId },
      });

      // 4. Return the versions
      return res.status(200).json(versions);
    } catch (error) {
      console.error('Error fetching schema versions:', error);
      return res
        .status(500)
        .json({ error: 'Failed to fetch schema versions', details: error });
    }
  },

    // Get a specific schema version
    async getSchemaVersion(req: Request, res: Response) {
      try {
        const { versionId } = req.params;
        const userId = req.user.id;
  
        // 1. Validate input
        if (!versionId) {
          return res.status(400).json({ error: 'Version ID is required' });
        }
  
        // 2. Verify that the user is a member of the project's workspace.
        const version = await prisma.schemaVersion.findUnique({
          where: { id: versionId },
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
  
        if (!version) {
          return res.status(404).json({ error: 'Version not found' });
        }
  
        const isMember = version.schema.project.workspace.members.some(m => m.userId === userId);
        if (!isMember) {
          return res.status(403).json({ error: "Unauthorized" });
        }
  
        // 3. Fetch the version
        const fetchedVersion = await prisma.schemaVersion.findUnique({
          where: { id: versionId },
        });
  
        // 4. Return the version
        return res.status(200).json(fetchedVersion);
      } catch (error) {
        console.error('Error fetching schema version:', error);
        return res
          .status(500)
          .json({ error: 'Failed to fetch schema version', details: error });
      }
    },

  // Restore a schema to a specific version
  async restoreSchemaVersion(req: Request, res: Response) {
    try {
      const { versionId } = req.params;
      const userId = req.user.id;

      // 1. Validate input
      if (!versionId) {
        return res.status(400).json({ error: 'Version ID is required' });
      }

      // 2. Fetch the schema version to restore
      const version = await prisma.schemaVersion.findUnique({
        where: { id: versionId },
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

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      const isMember = version.schema.project.workspace.members.some(m => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 3. Parse the snapshot JSON
      const snapshot = JSON.parse(version.snapshotJson);

      // 4.  Delete the existing schema and its related tables, columns, and relationships
      await prisma.relationship.deleteMany({
        where: {
          OR: [
            { fromTable: { schemaId: version.schemaId } },
            { toTable: { schemaId: version.schemaId } },
          ],
        },
      });
      await prisma.column.deleteMany({
        where: {
          table: {
            schemaId: version.schemaId
          }
        }
      });
      await prisma.table.deleteMany({
        where: { schemaId: version.schemaId },
      });
      await prisma.schema.delete({
        where: { id: version.schemaId },
      });


      // 5. Restore the schema and its related data from the snapshot
      const restoredSchema = await prisma.schema.create({
        data: {
          ...snapshot,
          id: version.schemaId, //keep the same schemaId
          tables: {
            create: snapshot.tables.map((table: any) => ({
              ...table,
              id: table.id, // Keep the same tableId
              columns: {
                create: table.columns.map((column: any) => ({
                  ...column,
                  id: column.id, // Keep the same columnId
                })),
              },
              outgoingRelations: table.outgoingRelations.map((r: any) => ({
                ...r,
                id: r.id
              })),
              incomingRelations: table.incomingRelations.map((r:any) => ({
                ...r,
                id: r.id
              }))
            })),
          },
        },
        include: {
          tables: {
            include: {
              columns: true,
              outgoingRelations: true,
              incomingRelations: true
            },
          },
        },
      });

      // 6. Return the restored schema data
      return res.status(200).json(restoredSchema);
    } catch (error) {
      console.error('Error restoring schema version:', error);
      return res
        .status(500)
        .json({ error: 'Failed to restore schema version', details: error });
    }
  },
};

export default versionController;
