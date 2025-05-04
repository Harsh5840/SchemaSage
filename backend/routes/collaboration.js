import express from 'express';
import collaborationController from '../controllers/collaborationController.js'; // Corrected import path
import { verifyToken } from '../middleware/verifyToken.js';  // Corrected import path

const collaborationRouter = express.Router();

// Start a new collaboration session
collaborationRouter.post('/start/:schemaId', verifyToken, collaborationController.startSession);

// Join an existing collaboration session
collaborationRouter.post('/join/:sessionId', verifyToken, collaborationController.joinSession);

// Update cursor position
collaborationRouter.post('/cursor/:sessionId', verifyToken, collaborationController.updateCursor);

// Get session information
collaborationRouter.get('/session/:sessionId', verifyToken, collaborationController.getSession);

// Leave a collaboration session
collaborationRouter.delete('/leave/:sessionId', verifyToken, collaborationController.leaveSession);

export default collaborationRouter;