import { Request, Response, NextFunction } from 'express';
import { Document, Model } from 'mongoose';
import { AppError } from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';
import { APIFeatures } from '../utils/apiFeatures';
import { formatResponse, getPaginationMeta } from '../utils/helpers';

export class BaseController<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Create a new document
   */
  createOne = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await this.model.create(req.body);

    res.status(201).json(
      formatResponse('success', 'Document created successfully', { doc })
    );
  });

  /**
   * Get all documents with filtering, sorting, and pagination
   */
  getAll = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Execute query
    const features = new APIFeatures(this.model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    const docs = await features.query;
    
    // Get total count for pagination
    const totalDocs = await this.model.countDocuments();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const paginationMeta = getPaginationMeta(totalDocs, page, limit);

    res.status(200).json(
      formatResponse(
        'success',
        'Documents retrieved successfully',
        { docs, results: docs.length },
        paginationMeta
      )
    );
  });

  /**
   * Get a single document by ID
   */
  getOne = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    let query = this.model.findById(id);
    
    // Add populate if specified in query
    if (req.query.populate) {
      query = query.populate(req.query.populate as string);
    }
    
    const doc = await query;

    if (!doc) {
      return next(new AppError('Document not found', 404));
    }

    res.status(200).json(
      formatResponse('success', 'Document retrieved successfully', { doc })
    );
  });

  /**
   * Update a document by ID
   */
  updateOne = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    const doc = await this.model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('Document not found', 404));
    }

    res.status(200).json(
      formatResponse('success', 'Document updated successfully', { doc })
    );
  });

  /**
   * Delete a document by ID
   */
  deleteOne = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    const doc = await this.model.findByIdAndDelete(id);

    if (!doc) {
      return next(new AppError('Document not found', 404));
    }

    res.status(204).json(
      formatResponse('success', 'Document deleted successfully')
    );
  });

  /**
   * Soft delete a document by ID
   */
  softDeleteOne = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    const doc = await this.model.findByIdAndUpdate(
      id,
      { active: false, deletedAt: new Date() },
      { new: true }
    );

    if (!doc) {
      return next(new AppError('Document not found', 404));
    }

    res.status(200).json(
      formatResponse('success', 'Document deleted successfully', { doc })
    );
  });

  /**
   * Get document statistics
   */
  getStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const stats = await this.model.aggregate([
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          activeDocuments: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] }
          },
          createdThisMonth: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$createdAt',
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json(
      formatResponse('success', 'Statistics retrieved successfully', { stats: stats[0] || {} })
    );
  });
}