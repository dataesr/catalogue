import { Elysia } from 'elysia';
import { AppError, RateLimitError } from './errors';
import { DEFAULT_STATUS_MAP } from './status-map';

export interface ErrorHandlerConfig {
  isProduction: boolean;
  /**
   * Additional app-specific error code → HTTP status mappings.
   * Merged with (and overrides) the built-in defaults.
   */
  extraStatusMap?: Record<string, number>;
}

function logError(
  code: string | number,
  error: unknown,
  isProduction: boolean,
  requestId?: string,
) {
  const message = error instanceof Error ? error.message : String(error);
  const errorCode = error instanceof AppError ? error.code : code;
  const rid = requestId ? requestId.slice(0, 8) : '--------';

  if (isProduction) {
    console.error(
      `[${new Date().toLocaleTimeString('fr-FR')}] ${rid} ERROR ${errorCode} ${message}`,
    );
  } else {
    console.error(`[ERROR ${code}]:`, error);
  }
}

/**
 * Creates a global error handler plugin for Elysia.
 *
 * Maps `AppError` subclasses to the correct HTTP status codes and returns
 * a consistent JSON error envelope `{ code, message, details? }`.
 *
 * In development, validation errors and 500s include extra `details`.
 *
 * @example
 * ```ts
 * import { createErrorHandler } from '@dataesr/http/error-handler';
 *
 * const app = new Elysia()
 *   .use(createErrorHandler({ isProduction: config.isProduction }));
 * ```
 */
export function createErrorHandler(config: ErrorHandlerConfig) {
  const statusMap = { ...DEFAULT_STATUS_MAP, ...config.extraStatusMap };

  return new Elysia({ name: 'desr-error-handler' })
    .onError(({ code, error, set, ...ctx }) => {
      const requestId = 'requestId' in ctx ? (ctx.requestId as string) : undefined;
      logError(code, error, config.isProduction, requestId);

      if (error instanceof AppError) {
        set.status = statusMap[error.code] ?? 500;

        if (error instanceof RateLimitError) {
          set.headers['Retry-After'] = error.retryAfter.toString();
        }

        return {
          code: error.code,
          message: error.message,
          ...(!config.isProduction && error.details ? { details: error.details } : {}),
        };
      }

      switch (code) {
        case 'VALIDATION': {
          set.status = 422;
          let details: Record<string, unknown> | undefined;
          if (!config.isProduction) {
            try {
              details = JSON.parse(error.message);
            } catch {
              details = { raw: error.message };
            }
          }
          return {
            code: 'VALIDATION_ERROR',
            message: 'Les données envoyées sont invalides',
            ...(details ? { details } : {}),
          };
        }

        case 'NOT_FOUND':
          set.status = 404;
          return {
            code: 'NOT_FOUND',
            message: 'La ressource demandée est introuvable',
          };

        case 'PARSE':
          set.status = 400;
          return {
            code: 'PARSE_ERROR',
            message: 'Format de requête invalide. Impossible de lire le corps de la requête.',
            ...(!config.isProduction ? { details: { message: error?.message } } : {}),
          };

        case 'INVALID_COOKIE_SIGNATURE':
          set.status = 401;
          return {
            code: 'INVALID_SESSION',
            message: 'Session invalide. Veuillez vous reconnecter.',
          };

        case 'INVALID_FILE_TYPE':
          set.status = 422;
          return {
            code: 'INVALID_FILE_TYPE',
            message: 'Type de fichier invalide. Veuillez envoyer un fichier valide.',
            ...(!config.isProduction ? { details: { message: error?.message } } : {}),
          };

        case 'INTERNAL_SERVER_ERROR':
        case 'UNKNOWN':
          set.status = 500;
          return {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Une erreur interne du serveur est survenue',
            ...(!config.isProduction
              ? { details: { message: error?.message, stack: error?.stack } }
              : {}),
          };

        default:
          set.status = 500;
          return {
            code: 'UNHANDLED_ERROR',
            message: 'Une erreur non gérée est survenue',
          };
      }
    })
    .as('scoped');
}
