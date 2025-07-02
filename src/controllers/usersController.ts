import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Missing required fields: email, name, password' });
  }
  const user = await prisma.user.create({
    data: { email, name, password }
  });
  res.status(201).json(user);
}; 