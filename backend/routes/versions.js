import express from 'express';
import versionController from '../controllers/versionController.js'; // Corrected import path
import { verifyToken } from '../middleware/verifyToken.js'; // Corrected import path

const versionRouter = express.Router();

// Create a new version of a schema (snapshot)
versionRouter.post('/create/:schemaId', verifyToken, versionController.createSchemaVersion);

// Get all versions of a schema
versionRouter.get('/:schemaId', verifyToken, versionController.getSchemaVersions);

// Get a specific schema version
versionRouter.get('/:versionId', verifyToken, versionController.getSchemaVersion);

// Restore a schema to a specific version
versionRouter.post('/restore/:versionId', verifyToken, versionController.restoreSchemaVersion);

export default versionRouter;
