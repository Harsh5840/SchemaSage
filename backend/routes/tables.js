import express from 'express';
import tableController from '../controllers/tableController.js'; // Corrected import path
import { verifyToken } from '../middleware/verifyToken.js'; // Corrected import path

const tableRouter = express.Router();

// Create a new table within a schema
tableRouter.post('/create', verifyToken, tableController.createTable);

// Get all tables for a schema
tableRouter.get('/:schemaId', verifyToken, tableController.getTablesBySchema);

// Get a specific table
tableRouter.get('/:tableId', verifyToken, tableController.getTable);

// Update a table (name, position)
tableRouter.put('/:tableId', verifyToken, tableController.updateTable);

// Delete a table
tableRouter.delete('/:tableId', verifyToken, tableController.deleteTable);

export default tableRouter;
