import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const getAllBookings = async (req: Request, res: Response) => {
  const bookings = await prisma.booking.findMany();
  res.json(bookings);
};

export const createBooking = async (req: Request, res: Response) => {
  const { userId, driverId, status } = req.body;
  const booking = await prisma.booking.create({
    data: { userId, driverId, status }
  });
  res.status(201).json(booking);
}; 