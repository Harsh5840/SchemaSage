// backend/controllers/projectController.js
import { prisma } from '../prisma';
import { verifyToken } from '../middleware/verifyToken';

const createProject = async (req, res) => {
  const { name, description, workspaceId } = req.body;
  const userId = req.user.id;

  if (!name || !workspaceId) {
    return res.status(400).json({ message: 'Project name and workspace ID are required' });
  }

  try {
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });

    if (!workspaceMember) {
      return res.status(403).json({ message: 'User is not a member of this workspace' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        workspaceId,
        createdById: userId,
      },
    });

    return res.status(201).json({ project });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all projects in a workspace
const getProjects = async (req, res) => {
  const { workspaceId } = req.query;
  const userId = req.user.id;

  if (!workspaceId) {
    return res.status(400).json({ message: 'Workspace ID is required' });
  }

  try {
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });

    if (!workspaceMember) {
      return res.status(403).json({ message: 'User is not a member of this workspace' });
    }

    const projects = await prisma.project.findMany({
      where: { workspaceId },
    });

    return res.status(200).json({ projects });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update project details
const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name && !description) {
    return res.status(400).json({ message: 'At least one field (name or description) is required to update' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.createdById !== userId) {
      return res.status(403).json({ message: 'User is not authorized to update this project' });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name || project.name,
        description: description || project.description,
      },
    });

    return res.status(200).json({ updatedProject });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.createdById !== userId) {
      return res.status(403).json({ message: 'User is not authorized to delete this project' });
    }

    await prisma.project.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export default {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
};
