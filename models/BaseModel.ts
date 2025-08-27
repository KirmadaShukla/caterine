import mongoose, { Schema, Document } from 'mongoose';

export interface IBaseModel extends Document {
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

export const baseSchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
  },
};

export const addBaseFields = (schema: Schema) => {
  schema.add({
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    deletedAt: {
      type: Date,
      select: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  });

  // Add pre-save middleware for soft delete
  schema.pre(/^find/, function (this: any, next) {
    // 'this' points to the current query
    this.find({ active: { $ne: false } });
    next();
  });

  // Add instance method for soft delete
  schema.methods.softDelete = function (this: IBaseModel, deletedBy?: mongoose.Types.ObjectId) {
    this.active = false;
    this.deletedAt = new Date();
    if (deletedBy) {
      this.updatedBy = deletedBy;
    }
    return this.save();
  };

  return schema;
};