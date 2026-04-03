export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly isOperational: boolean;

  constructor(
    code: string,
    message: string,
    httpStatus: number,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} with id '${id}' was not found.`, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('FORBIDDEN', 'You do not have permission to perform this action.', 403);
  }
}

export class ValidationError extends AppError {
  public readonly fields: Array<{ field: string; message: string }>;

  constructor(fields: Array<{ field: string; message: string }>) {
    super('VALIDATION_ERROR', 'One or more fields failed validation.', 400);
    this.fields = fields;
  }
}

export class ConflictError extends AppError {
  constructor(resource: string, detail: string) {
    super('CONFLICT', `${resource} conflict: ${detail}`, 409);
  }
}

export class BusinessRuleError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 422);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('UNAUTHORIZED', 'Authentication is required.', 401);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429);
  }
}
