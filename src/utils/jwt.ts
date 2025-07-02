import jwt, { JwtPayload } from 'jsonwebtoken';

export const generateToken = (payload: object): string => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

export const verifyToken = (token: string): string | JwtPayload => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const generateRefreshToken = (payload: object): string => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
}; 