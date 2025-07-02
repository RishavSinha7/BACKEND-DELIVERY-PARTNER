import { Router } from 'express';
import * as usersController from '../controllers/usersController';

const router = Router();

router.get('/', usersController.getAllUsers);
router.post('/', usersController.createUser);
// Add more routes as needed

export default router; 