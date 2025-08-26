import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import { AppError } from '../utils/appError';
import { signToken } from '../utils/helpers';
import config from '../config/env';

export interface CreateUserData {
  name: string;
  email: string;
  phone: number;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: number;
}

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserData): Promise<{ user: IUser; token: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Create user (password will be hashed by pre-save middleware)
    const user = await User.create(userData);

    // Generate JWT token
    const token = signToken((user._id as any).toString());

    return { user, token };
  }

  /**
   * Authenticate user login
   */
  static async loginUser(credentials: LoginCredentials): Promise<{ user: IUser; token: string }> {
    const { email, password } = credentials;

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password +active');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    // Check if user is active
    if (!user.active) {
      throw new AppError('Your account has been deactivated. Please contact support.', 401);
    }

    // Generate JWT token
    const token = signToken((user._id as any).toString());

    return { user, token };
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Get all users with pagination
   */
  static async getAllUsers(
    page: number = 1,
    limit: number = 10,
    filter: any = {}
  ): Promise<{ users: IUser[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');
    
    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Update user profile
   */
  static async updateUser(id: string, updateData: UpdateUserData): Promise<IUser> {
    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: id } 
      });
      
      if (existingUser) {
        throw new AppError('User with this email already exists', 400);
      }
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update user password
   */
  static async updatePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ user: IUser; token: string }> {
    const user = await User.findById(id).select('+password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if current password is correct
    if (!(await user.correctPassword(currentPassword, user.password))) {
      throw new AppError('Your current password is incorrect', 400);
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    // Generate new JWT token
    const token = signToken((user._id as any).toString());

    return { user, token };
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(id: string): Promise<void> {
    const user = await User.findByIdAndUpdate(id, { active: false });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
  }
}