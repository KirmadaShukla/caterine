import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { BaseController } from './baseController';
import { catchAsync } from '../utils/catchAsync';
import { formatResponse, getPaginationMeta } from '../utils/helpers';
import { AppError } from '../utils/appError';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  CreateUserInput,
  LoginInput,
  UpdateUserInput,
  UpdatePasswordInput,
} from '../types/user';

export class UserController extends BaseController<any> {
  constructor() {
    super(User);
  }

  // Authentication routes
  register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userData: CreateUserInput = req.body;
    
    const { user, token } = await UserService.createUser(userData);

    res.status(201).json(
      formatResponse('success', 'User registered successfully', {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      })
    );
  });

  login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const credentials: LoginInput = req.body;
    
    const { user, token } = await UserService.loginUser(credentials);

    res.status(200).json(
      formatResponse('success', 'Login successful', {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      })
    );
  });

  logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // In a stateless JWT system, logout is handled client-side
    // You might want to implement a token blacklist for additional security
    res.status(200).json(
      formatResponse('success', 'Logged out successfully')
    );
  });

  // Password management
  updatePassword = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { currentPassword, password }: UpdatePasswordInput = req.body;
    const userId = req.user._id.toString();
    
    const { user, token } = await UserService.updatePassword(userId, currentPassword, password);

    res.status(200).json(
      formatResponse('success', 'Password updated successfully', {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      })
    );
  });

  // User profile management
  getProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = await UserService.getUserById(req.user._id.toString());

    res.status(200).json(
      formatResponse('success', 'Profile retrieved successfully', { user })
    );
  });

  updateProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const updateData: UpdateUserInput = req.body;
    const userId = req.user._id.toString();
    
    // Remove password fields if they exist
    delete (updateData as any).password;
    delete (updateData as any).passwordConfirm;
    
    const user = await UserService.updateUser(userId, updateData);

    res.status(200).json(
      formatResponse('success', 'Profile updated successfully', { user })
    );
  });

  deleteProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id.toString();
    
    await UserService.deleteUser(userId);

    res.status(204).json(
      formatResponse('success', 'Account deleted successfully')
    );
  });
}