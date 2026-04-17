// =============================================================================
// Base error
// =============================================================================

export abstract class AppError extends Error {
  abstract code: string;

  constructor(
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// =============================================================================
// HTTP errors
// =============================================================================

export class BadRequestError extends AppError {
  code = 'BAD_REQUEST';

  constructor(message = 'Requête invalide', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class UnauthorizedError extends AppError {
  code = 'UNAUTHORIZED';

  constructor(message = 'Authentification requise', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class ForbiddenError extends AppError {
  code = 'FORBIDDEN';

  constructor(
    message = "Vous n'avez pas la permission d'effectuer cette action",
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}

export class NotFoundError extends AppError {
  code = 'NOT_FOUND';

  constructor(message = 'Ressource introuvable', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class ConflictError extends AppError {
  code = 'CONFLICT';

  constructor(message = 'Conflit avec une ressource existante', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class InternalServerError extends AppError {
  code = 'INTERNAL_SERVER_ERROR';

  constructor(message = 'Erreur interne du serveur', details?: Record<string, unknown>) {
    super(message, details);
  }
}

// =============================================================================
// Auth errors
// =============================================================================

export class InvalidCredentialsError extends AppError {
  code = 'INVALID_CREDENTIALS';

  constructor(message = 'Identifiants incorrects', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class AccountInactiveError extends AppError {
  code = 'ACCOUNT_INACTIVE';

  constructor(message = 'Compte inactif', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class InvalidTokenError extends AppError {
  code = 'INVALID_TOKEN';

  constructor(message = 'Jeton invalide ou expiré', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class TokenMissingError extends AppError {
  code = 'TOKEN_MISSING';

  constructor(message = 'Jeton requis', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class InvalidSessionError extends AppError {
  code = 'INVALID_SESSION';

  constructor(message = 'Session invalide ou expirée', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class SessionReuseError extends AppError {
  code = 'SESSION_REUSE';

  constructor(
    message = 'Réutilisation de session détectée — toutes les sessions ont été révoquées',
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}

export class SessionNotFoundError extends AppError {
  code = 'SESSION_NOT_FOUND';

  constructor(message = 'Session introuvable', details?: Record<string, unknown>) {
    super(message, details);
  }
}

// =============================================================================
// Rate limiting
// =============================================================================

export class RateLimitError extends AppError {
  code = 'RATE_LIMIT_EXCEEDED';

  public readonly retryAfter: number;

  constructor(
    message = 'Trop de requêtes. Veuillez réessayer plus tard.',
    retryAfter = 60,
    details?: Record<string, unknown>,
  ) {
    super(message, details);
    this.retryAfter = retryAfter;
  }
}

// =============================================================================
// Domain errors
// =============================================================================

export class DatabaseError extends AppError {
  code = 'DATABASE_ERROR';

  constructor(message = 'Erreur de base de données', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class EmailAlreadyExistsError extends AppError {
  code = 'EMAIL_ALREADY_EXISTS';

  constructor(message = 'Cet email est déjà utilisé', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class JWTFailedError extends AppError {
  code = 'JWT_FAILED';

  constructor(message = 'Échec de la génération du jeton JWT', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class MailerFailedError extends AppError {
  code = 'MAILER_FAILED';

  constructor(message = "Échec de l'envoi de l'email", details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class PasswordMismatchError extends AppError {
  code = 'PASSWORD_MISMATCH';

  constructor(
    message = 'Les mots de passe ne correspondent pas',
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}

export class UserNotFoundError extends AppError {
  code = 'USER_NOT_FOUND';

  constructor(message = 'Utilisateur introuvable', details?: Record<string, unknown>) {
    super(message, details);
  }
}

// =============================================================================
// Challenge & 2FA errors
// =============================================================================

export class ChallengeRequiredError extends AppError {
  code = 'CHALLENGE_REQUIRED';

  constructor(message = 'Vérification supplémentaire requise', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class ChallengeExpiredError extends AppError {
  code = 'CHALLENGE_EXPIRED';

  constructor(message = 'Le défi de vérification a expiré', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class ChallengeMaxAttemptsError extends AppError {
  code = 'CHALLENGE_MAX_ATTEMPTS';

  constructor(message = 'Nombre maximum de tentatives atteint', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class TwoFactorAlreadyEnabledError extends AppError {
  code = 'TWO_FACTOR_ALREADY_ENABLED';

  constructor(
    message = "L'authentification à deux facteurs est déjà activée",
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}

export class TwoFactorNotEnabledError extends AppError {
  code = 'TWO_FACTOR_NOT_ENABLED';

  constructor(
    message = "L'authentification à deux facteurs n'est pas activée",
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}

export class InvalidOtpCodeError extends AppError {
  code = 'INVALID_OTP_CODE';

  constructor(message = 'Code de vérification invalide', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class EmailNotVerifiedError extends AppError {
  code = 'EMAIL_NOT_VERIFIED';

  constructor(
    message = 'Veuillez vérifier votre adresse email',
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}
