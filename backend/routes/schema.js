import express from 'express';
import schemaController from '../controllers/schemaController.js'; // Corrected import path
import { verifyToken } from '../middleware/verifyToken.js'; // Corrected import path

const schemaRouter = express.Router();

// Create a new schema within a project
schemaRouter.post('/create', verifyToken, schemaController.createSchema);

// Get all schemas for a project
schemaRouter.get('/:projectId', verifyToken, schemaController.getSchemasByProject);

// Get a specific schema
schemaRouter.get('/:schemaId', verifyToken, schemaController.getSchema);

// Update a schema (name)
schemaRouter.put('/:schemaId', verifyToken, schemaController.updateSchema);

// Delete a schema
schemaRouter.delete('/:schemaId', verifyToken, schemaController.deleteSchema);

export default schemaRouter;