import express from 'express';
import columnController from '../controllers/columnController.js'; // Corrected import path
import { verifyToken } from '../middleware/verifyToken.js'; // Corrected import path

const columnRouter = express.Router();

// Create a new column within a table
columnRouter.post('/create', verifyToken, columnController.createColumn);

// Get all columns for a table
columnRouter.get('/:tableId', verifyToken, columnController.getColumnsByTable);

// Get a specific column
columnRouter.get('/:columnId', verifyToken, columnController.getColumn);

// Update a column
columnRouter.put('/:columnId', verifyToken, columnController.updateColumn);

// Delete a column
columnRouter.delete('/:columnId', verifyToken, columnController.deleteColumn);

export default columnRouter;