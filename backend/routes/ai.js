import express from 'express';
import aiController from '../controllers/aiController.js'; // Corrected import path
import { verifyToken } from '../middleware/verifyToken.js'; // Corrected import path

const aiRouter = express.Router();

// Record an AI interaction for a schema
aiRouter.post('/interact/:schemaId', verifyToken, aiController.recordInteraction);

// Get all AI interactions for a schema
aiRouter.get('/interactions/:schemaId', verifyToken, aiController.getInteractionsBySchema);

export default aiRouter;