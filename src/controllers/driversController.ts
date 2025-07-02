import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const getAllDrivers = async (req: Request, res: Response) => {
  const drivers = await prisma.driver.findMany();
  res.json(drivers);
};

export const createDriver = async (req: Request, res: Response) => {
  const { name, licenseNo, vehicleType, vehicleNumber } = req.body;
  const driver = await prisma.driver.create({
    data: { name, licenseNo, vehicleType, vehicleNumber }
  });
  res.status(201).json(driver);
}; 