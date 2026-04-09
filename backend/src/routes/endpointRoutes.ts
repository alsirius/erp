import { Router } from 'express';
import { EndpointController } from '../controllers/endpoint/EndpointController';
import { EndpointService } from '../services/endpoint/EndpointService';
import { EndpointDAO } from '../dao/endpoint/EndpointDAO';
import { SnowflakeEndpointDAO } from '../dao/endpoint/SnowflakeEndpointDAO';
import { databaseManager } from '../database/DatabaseManager';
import { querySnowflake } from '../utils/snowflake';
import { tokenAuth } from '../middleware/auth';

const router = Router();

// Lazy initialization
let endpointController: EndpointController;

function getController() {
  if (!endpointController) {
    const useSnowflake = process.env.DB_ENGINE === 'snowflake';
    let endpointDao: any;

    if (useSnowflake) {
      console.log('❄️ Using Snowflake for Endpoints');
      endpointDao = new SnowflakeEndpointDAO(querySnowflake);
    } else {
      console.log('📦 Using SQLite for Endpoints');
      const db = databaseManager.getDatabase();
      endpointDao = new EndpointDAO(db);
      
      // Auto-migrate for SQLite
      endpointDao.migrate().catch((err: Error) => {
        console.error('Failed to migrate SQLite endpoint table:', err);
      });
    }

    const endpointService = new EndpointService(endpointDao);
    endpointController = new EndpointController(endpointService);
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
