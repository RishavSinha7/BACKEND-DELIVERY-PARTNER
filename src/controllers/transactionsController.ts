import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const getAllTransactions = async (req: Request, res: Response) => {
  const transactions = await prisma.transaction.findMany();
  res.json(transactions);
};

export const createTransaction = async (req: Request, res: Response) => {
  const { userId, bookingId, couponId, amount } = req.body;
  const transaction = await prisma.transaction.create({
    data: { userId, bookingId, couponId, amount }
  });
  res.status(201).json(transaction);
}; 