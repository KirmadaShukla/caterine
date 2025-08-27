export interface ApiResponse<T = any> {
  status: 'success' | 'fail' | 'error';
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ValidationError[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  [key: string]: any;
}

export interface JWTPayload {
  id: string;
  iat: number;
  exp: number;
}

export interface DatabaseConfig {
  uri: string;
  options?: {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
  };
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
}

export type UserRole = 'user' | 'admin' | 'moderator';

export type SortOrder = 'asc' | 'desc' | 1 | -1;