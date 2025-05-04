import express from 'express';
import relationshipController from '../controllers/relationshipController.js'; // Corrected import path
import { verifyToken } from '../middleware/verifyToken.js'; // Corrected import path

const relationshipRouter = express.Router();

// Create a new relationship
relationshipRouter.post('/create', verifyToken, relationshipController.createRelationship);

// Get all relationships for a schema
relationshipRouter.get('/:schemaId', verifyToken, relationshipController.getRelationshipsBySchema);

// Get a specific relationship
relationshipRouter.get('/:relationshipId', verifyToken, relationshipController.getRelationship);

// Update a relationship
relationshipRouter.put('/:relationshipId', verifyToken, relationshipController.updateRelationship);

// Delete a relationship
relationshipRouter.delete('/:relationshipId', verifyToken, relationshipController.deleteRelationship);

export default relationshipRouter;