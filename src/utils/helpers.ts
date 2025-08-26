import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/env';

/**
 * Generate a JWT token
 */
export const signToken = (id: string): string => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any // Cast to avoid type conflicts
  });
};

/**
 * Generate a secure random token
 */
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token using SHA-256
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a random string of specified length
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Format response object
 */
export const formatResponse = (
  status: 'success' | 'fail' | 'error',
  message: string,
  data?: any,
  meta?: any
) => {
  const response: any = {
    status,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
};

/**
 * Calculate pagination metadata
 */
export const getPaginationMeta = (
  total: number,
  page: number,
  limit: number
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
};

/**
 * Sanitize user input by removing HTML tags
 */
export const sanitizeInput = (input: string): string => {
  return input.replace(/<[^>]*>/g, '');
};

/**
 * Generate slug from string
 */
export const generateSlug = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format date to ISO string
 */
export const formatDate = (date: Date | string): string => {
  return new Date(date).toISOString();
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};