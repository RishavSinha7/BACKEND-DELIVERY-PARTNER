import { Router } from 'express';
import * as driversController from '../controllers/driversController';

const router = Router();

router.get('/', driversController.getAllDrivers);
router.post('/', driversController.createDriver);
// Add more routes as needed

export default router; 