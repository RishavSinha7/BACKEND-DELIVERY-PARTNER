import { Router } from 'express';
import * as couponsController from '../controllers/couponsController';

const router = Router();

router.get('/', couponsController.getAllCoupons);
router.post('/', couponsController.createCoupon);
// Add more routes as needed

export default router; 