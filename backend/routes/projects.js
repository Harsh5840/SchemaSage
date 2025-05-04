// backend/routes/projects.js
import express from 'express';
import projectController from '../controllers/projectController';
import { verifyToken } from '../middleware/verifyToken';

const projectRouter = express.Router();

// Create a new project
projectRouter.post('/create', verifyToken, projectController.createProject);

// Get all projects for a specific workspace
projectRouter.get('/', verifyToken, projectController.getProjects);

// Update a project by ID
projectRouter.put('/:id', verifyToken, projectController.updateProject);

// Delete a project by ID
projectRouter.delete('/:id', verifyToken, projectController.deleteProject);

export default projectRouter;
