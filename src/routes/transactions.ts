import { Router } from 'express';
import * as transactionsController from '../controllers/transactionsController';

const router = Router();

router.get('/', transactionsController.getAllTransactions);
router.post('/', transactionsController.createTransaction);
// Add more routes as needed

export default router; 