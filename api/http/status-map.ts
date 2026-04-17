/**
 * Default mapping from `AppError.code` to HTTP status codes.
 *
 * Used by `createErrorHandler()` in `@dataesr/elysia-utils`.
 * Apps can extend this via `extraStatusMap` when calling the factory.
 */
export const DEFAULT_STATUS_MAP: Record<string, number> = {
  // 400 Bad Request
  BAD_REQUEST: 400,
  INVALID_TOKEN: 400,
  TOKEN_MISSING: 400,
  PASSWORD_MISMATCH: 400,

  // 401 Unauthorized
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  INVALID_SESSION: 401,
  SESSION_REUSE: 401,

  // 403 Forbidden
  FORBIDDEN: 403,
  ACCOUNT_INACTIVE: 403,
  EMAIL_NOT_VERIFIED: 403,

  // 404 Not Found
  NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,

  // 409 Conflict
  CONFLICT: 409,
  EMAIL_ALREADY_EXISTS: 409,

  // 400 Challenge & 2FA
  CHALLENGE_REQUIRED: 400,
  CHALLENGE_EXPIRED: 400,
  CHALLENGE_MAX_ATTEMPTS: 400,
  TWO_FACTOR_ALREADY_ENABLED: 400,
  TWO_FACTOR_NOT_ENABLED: 400,
  INVALID_OTP_CODE: 401,

  // 429 Rate Limited
  RATE_LIMIT_EXCEEDED: 429,

  // 500 Internal Server Error
  DATABASE_ERROR: 500,
  INTERNAL_SERVER_ERROR: 500,
  JWT_FAILED: 500,
  MAILER_FAILED: 500,
};
