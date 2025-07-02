import { Request, Response, NextFunction } from 'express';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement validation logic
  next();
}; 