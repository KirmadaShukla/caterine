import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import Admin from '../models/Admin';
import { AppError } from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';
import config from '../config/env';

export interface AuthenticatedAdminRequest extends Request {
  admin?: any;
}

export const authenticateAdmin = catchAsync(
  async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    // 1) Getting token and check if it's there
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in as admin! Please log in to get access.', 401)
      );
    }

    // 2) Verification token
    const decoded: any = await promisify(jwt.verify as any)(token, config.jwtSecret);

    // 3) Check if admin still exists
    const currentAdmin = await Admin.findById(decoded.id);
    if (!currentAdmin) {
      return next(
        new AppError('The admin belonging to this token does no longer exist.', 401)
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.admin = currentAdmin;
    next();
  }
);