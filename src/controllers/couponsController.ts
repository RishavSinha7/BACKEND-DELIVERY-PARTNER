import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const getAllCoupons = async (req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany();
  res.json(coupons);
};

export const createCoupon = async (req: Request, res: Response) => {
  const { code, discount, validTill } = req.body;
  const coupon = await prisma.coupon.create({
    data: { code, discount, validTill }
  });
  res.status(201).json(coupon);
}; 