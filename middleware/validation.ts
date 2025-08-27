import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../utils/appError';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: 'path' in error ? error.path : 'field',
      message: error.msg,
      value: 'value' in error ? error.value : undefined
    }));
    
    const error = new AppError('Validation failed', 400);
    error.errors = errorMessages;
    return next(error);
  }
  
  next();
};

// Simple validation rules - MongoDB schema handles detailed validation
export const validateUserRegistration = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').isNumeric().withMessage('Phone number must be numeric'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('passwordConfirm').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  }),
  handleValidationErrors
];

export const validateUserLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

export const validatePasswordUpdate = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('passwordConfirm').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  }),
  handleValidationErrors
];

export const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  handleValidationErrors
];

// Admin validation
export const validateAdminLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

export const validateAdminCreation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidationErrors
];

// Site settings validation - MongoDB schema handles detailed validation
export const validateSiteSettings = [
  body('heroSectionText.title').optional().trim().notEmpty().withMessage('Hero title cannot be empty'),
  body('heroSectionText.subtitle').optional().trim().notEmpty().withMessage('Hero subtitle cannot be empty'),
  body('aboutSectionText.title').optional().trim().notEmpty().withMessage('About title cannot be empty'),
  body('aboutSectionText.content').optional().trim().notEmpty().withMessage('About content cannot be empty'),
  handleValidationErrors
];