import { prisma } from '../prisma/client.js';
import { Request, Response } from 'express';

const schemaController = {
    async createSchema(req: Request, res: Response) {
        try {
            const { projectId, name } = req.body;
            const userId = req.user.id;

            if (!projectId || !name) {
                return res.status(400).json({ error: 'Project ID and schema name are required' });
            }

            const project = await prisma.project.findUnique({
                where: { id: projectId },
                include: { workspace: { include: { members: true } } },
            });

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const isMember = project.workspace.members.some((member) => member.userId === userId);

            if (!isMember) {
                return res.status(403).json({
                    error: 'User is not a member of the workspace containing this project',
                });
            }

            const newSchema = await prisma.schema.create({
                data: {
                    name,
                    projectId,
                },
            });

            return res.status(201).json(newSchema);
        } catch (error) {
            console.error('Error creating schema:', error);
            return res
                .status(500)
                .json({ error: 'Failed to create schema', details: error });
        }
    },

    async getSchemasByProject(req: Request, res: Response) {
        try {
            const { projectId } = req.params;
             const userId = req.user.id;

            if (!projectId) {
                return res.status(400).json({ error: 'Project ID is required' });
            }
             const project = await prisma.project.findUnique({
                where: { id: projectId },
                include: { workspace: { include: { members: true } } },
              });

              if (!project) {
                return res.status(404).json({ error: 'Project not found' });
              }
              const isMember = project.workspace.members.some(m => m.userId === userId);
              if (!isMember) {
                return res.status(403).json({ error: "Unauthorized" });
              }

            const schemas = await prisma.schema.findMany({
                where: { projectId },
            });

            return res.status(200).json(schemas);
        } catch (error) {
            console.error('Error fetching schemas:', error);
            return res
                .status(500)
                .json({ error: 'Failed to fetch schemas', details: error });
        }
    },

    async getSchema(req: Request, res: Response) {
        try {
            const { schemaId } = req.params;
            const userId = req.user.id;

            if (!schemaId) {
                return res.status(400).json({ error: 'Schema ID is required' });
            }
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

            const fetchedSchema = await prisma.schema.findUnique({
                where: { id: schemaId },
                include: {
                    tables: true,
                    versions: true,
                    aiInteractions: true,
                    sessions: true
                },
            });

            if (!fetchedSchema) {
                return res.status(404).json({ error: 'Schema not found' });
            }

            return res.status(200).json(fetchedSchema);
        } catch (error) {
            console.error('Error fetching schema:', error);
            return res
                .status(500)
                .json({ error: 'Failed to fetch schema', details: error });
        }
    },

    async updateSchema(req: Request, res: Response) {
        try {
            const { schemaId } = req.params;
            const { name } = req.body;
            const userId = req.user.id;

            if (!schemaId || !name) {
                return res.status(400).json({ error: 'Schema ID and new name are required' });
            }
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

            const updatedSchema = await prisma.schema.update({
                where: { id: schemaId },
                data: { name },
            });

            return res.status(200).json(updatedSchema);
        } catch (error) {
            console.error('Error updating schema:', error);
            return res
                .status(500)
                .json({ error: 'Failed to update schema', details: error });
        }
    },

    async deleteSchema(req: Request, res: Response) {
        try {
            const { schemaId } = req.params;
            const userId = req.user.id;

            if (!schemaId) {
                return res.status(400).json({ error: 'Schema ID is required' });
            }
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

            await prisma.schema.delete({
                where: { id: schemaId },
            });

            return res.status(200).json({ message: 'Schema deleted successfully' });
        } catch (error) {
            console.error('Error deleting schema:', error);
            return res
                .status(500)
                .json({ error: 'Failed to delete schema', details: error });
        }
    },
};

export default schemaController;
