import { Document } from 'mongoose';
import { UserRole } from './common';

export interface IUserBase {
  name: string;
  email: string;
  phone: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
}

export interface IUser extends IUserBase, IUserMethods, Document {
  password: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  phone: number;
  password: string;
  passwordConfirm: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: number;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  password: string;
  passwordConfirm: string;
}

export interface UserAuthResponse {
  status: string;
  token: string;
  user: Partial<IUser>;
}

export interface UserListResponse {
  status: string;
  results: number;
  data: {
    users: IUser[];
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}