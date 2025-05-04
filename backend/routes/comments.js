import express from 'express';
import commentController from '../controllers/commentController.js'; // Corrected import path
import { verifyToken } from '../middleware/verifyToken.js'; // Corrected import path

const commentRouter = express.Router();

// Create a new comment on a table
commentRouter.post('/create', verifyToken, commentController.createComment);

// Get all comments for a table
commentRouter.get('/:tableId', verifyToken, commentController.getCommentsByTable);

// Get a specific comment
commentRouter.get('/:commentId', verifyToken, commentController.getComment);

// Delete a comment
commentRouter.delete('/:commentId', verifyToken, commentController.deleteComment);

export default commentRouter;