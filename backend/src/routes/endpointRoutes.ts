import { Router } from 'express';
import { EndpointController } from '../controllers/endpoint/EndpointController';
import { EndpointService } from '../services/endpoint/EndpointService';
import { EndpointDAO } from '../dao/endpoint/EndpointDAO';
import { databaseManager } from '../database/DatabaseManager';
import { tokenAuth } from '../middleware/auth';

const router = Router();

// Lazy initialization to ensure database is initialized first
let endpointController: EndpointController;

function getController() {
  if (!endpointController) {
    const db = databaseManager.getDatabase();
    const endpointDao = new EndpointDAO(db);
    const endpointService = new EndpointService(endpointDao);
    endpointController = new EndpointController(endpointService);
    
    // Migration call (Idempotent)
    endpointDao.migrate().catch(err => {
      console.error('Failed to migrate endpoint table:', err);
    });
  }
  return endpointController;
}

// Routes
router.post('/', tokenAuth, (req, res) => getController().create(req, res));
router.get('/', tokenAuth, (req, res) => getController().list(req, res));
router.get('/:id', tokenAuth, (req, res) => getController().getById(req, res));
router.put('/:id', tokenAuth, (req, res) => getController().update(req, res));
router.delete('/:id', tokenAuth, (req, res) => getController().delete(req, res));

export const endpointRoutes = router;
