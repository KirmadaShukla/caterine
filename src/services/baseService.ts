import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { AppError } from '../utils/appError';
import { APIFeatures } from '../utils/apiFeatures';

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class BaseService<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Create a new document
   */
  async create(data: Partial<T>): Promise<T> {
    const doc = await this.model.create(data);
    return doc;
  }

  /**
   * Find document by ID
   */
  async findById(id: string, populateOptions?: string): Promise<T> {
    let query = this.model.findById(id);
    
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    
    const doc = await query;
    
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    
    return doc;
  }

  /**
   * Find one document by filter
   */
  async findOne(filter: FilterQuery<T>, populateOptions?: string): Promise<T | null> {
    let query = this.model.findOne(filter);
    
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    
    return await query;
  }

  /**
   * Find all documents with advanced filtering
   */
  async findAll(queryString: any): Promise<T[]> {
    const features = new APIFeatures(this.model.find(), queryString)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    const docs = await features.query;
    return docs;
  }

  /**
   * Find documents with pagination
   */
  async findWithPagination(
    filter: FilterQuery<T> = {},
    page: number = 1,
    limit: number = 10,
    sort: string = '-createdAt',
    populateOptions?: string
  ): Promise<PaginationResult<T>> {
    const skip = (page - 1) * limit;
    
    let query = this.model.find(filter).sort(sort).skip(skip).limit(limit);
    
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    
    const [data, total] = await Promise.all([
      query,
      this.model.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }

  /**
   * Update document by ID
   */
  async findByIdAndUpdate(
    id: string,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true, runValidators: true }
  ): Promise<T> {
    const doc = await this.model.findByIdAndUpdate(id, update, options);
    
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    
    return doc;
  }

  /**
   * Update one document by filter
   */
  async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true, runValidators: true }
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, update, options);
  }

  /**
   * Delete document by ID (hard delete)
   */
  async findByIdAndDelete(id: string): Promise<T> {
    const doc = await this.model.findByIdAndDelete(id);
    
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    
    return doc;
  }

  /**
   * Soft delete document by ID
   */
  async softDelete(id: string): Promise<T> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { active: false, deletedAt: new Date() },
      { new: true }
    );
    
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    
    return doc;
  }

  /**
   * Count documents
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter);
  }

  /**
   * Check if document exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter);
    return count > 0;
  }

  /**
   * Aggregate data
   */
  async aggregate(pipeline: any[]): Promise<any[]> {
    return await this.model.aggregate(pipeline);
  }
}