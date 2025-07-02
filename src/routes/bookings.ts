import { Router } from 'express';
import * as bookingsController from '../controllers/bookingsController';

const router = Router();

router.get('/', bookingsController.getAllBookings);
router.post('/', bookingsController.createBooking);
// Add more routes as needed

export default router; 