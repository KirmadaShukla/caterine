import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserMethods } from '../types/user';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be longer than 50 characters'],
      minlength: [2, 'Name must be at least 2 characters long'],
      validate: {
        validator: function(value: string) {
          return /^[a-zA-Z\s]+$/.test(value);
        },
        message: 'Name should only contain letters and spaces'
      }
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(value: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Please provide a valid email address'
      }
    },
    phone: {
      type: Number,
      required: [true, 'Please provide a phone number'],
      validate: {
        validator: function(value: number) {
          return /^[0-9]{10,15}$/.test(value.toString());
        },
        message: 'Please provide a valid phone number (10-15 digits)'
      }
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator: function(value: string) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value);
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      },
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: {
      virtuals: true,
      transform: function (doc: any, ret: any) {
        if (ret.password) ret.password = undefined;
        if (ret.__v !== undefined) ret.__v = undefined;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes
userSchema.index({ active: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware
userSchema.pre('save', async function (this: IUser, next) {
  // Only run if password was modified
  if (!this.isModified('password')) return next();

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// Query middleware - exclude inactive users by default
userSchema.pre(/^find/, function (this: any, next) {
  // 'this' points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// Instance methods
userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;
export { IUser };