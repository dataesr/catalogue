import { Elysia } from 'elysia';

export interface LoggerConfig {
  isProduction: boolean;
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  get: '\x1b[36m',
  post: '\x1b[33m',
  put: '\x1b[35m',
  delete: '\x1b[31m',
  patch: '\x1b[34m',

  success: '\x1b[32m',
  redirect: '\x1b[36m',
  clientError: '\x1b[33m',
  serverError: '\x1b[31m',

  fast: '\x1b[32m',
  medium: '\x1b[33m',
  slow: '\x1b[31m',

  gray: '\x1b[90m',
  white: '\x1b[37m',
} as const;

function getMethodColor(method: string): string {
  const map: Record<string, string> = {
    GET: colors.get,
    POST: colors.post,
    PUT: colors.put,
    DELETE: colors.delete,
    PATCH: colors.patch,
  };
  return map[method.toUpperCase()] || colors.white;
}

function getStatusColor(status: number): string {
  if (status >= 500) return colors.serverError;
  if (status >= 400) return colors.clientError;
  if (status >= 300) return colors.redirect;
  if (status >= 200) return colors.success;
  return colors.white;
}

function getTimingColor(ms: number): string {
  if (ms < 100) return colors.fast;
  if (ms < 500) return colors.medium;
  return colors.slow;
}

function formatTiming(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatProdLog(
  time: string,
  requestId: string,
  method: string,
  status: number,
  duration: string,
  path: string,
  query?: string,
): string {
  const parts = [
    `[${time}]`,
    requestId.slice(0, 8),
    method.padEnd(7),
    String(status),
    duration,
    path,
  ];
  if (query) parts.push(query);
  return parts.join(' ');
}

function formatDevLog(
  time: string,
  requestId: string,
  method: string,
  status: number,
  duration: number,
  path: string,
  query?: string,
): string {
  const methodColor = getMethodColor(method);
  const statusColor = getStatusColor(status);
  const timingColor = getTimingColor(duration);

  const parts = [
    `${colors.gray}[${time}]${colors.reset}`,
    `${colors.gray}${requestId.slice(0, 8)}${colors.reset}`,
    `${methodColor}${method.padEnd(7)}${colors.reset}`,
    `${statusColor}${status}${colors.reset}`,
    `${timingColor}${colors.bright}${formatTiming(duration)}${colors.reset}`,
    `${colors.white}${path}${colors.reset}`,
  ];
  if (query) parts.push(`${colors.dim}${query}${colors.reset}`);
  return parts.join(' ');
}

/**
 * Creates a request logger plugin.
 *
 * - **Development**: colored, human-readable output with timing highlights.
 * - **Production**: compact structured lines suitable for log aggregation.
 *
 * Injects `requestId` into the context (reads `x-request-id` header or generates a UUID).
 *
 * @example
 * ```ts
 * import { createLogger } from '@dataesr/http/logger';
 *
 * const app = new Elysia()
 *   .use(createLogger({ isProduction: config.isProduction }));
 * ```
 */
export function createLogger(config: LoggerConfig) {
  return new Elysia({ name: 'desr-logger' })
    .state('startTime', 0)
    .derive(({ request }) => {
      const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
      return { requestId };
    })
    .onBeforeHandle(({ store, set, requestId }) => {
      store.startTime = performance.now();
      set.headers['x-request-id'] = requestId;
    })
    .onAfterResponse(({ request, set, store }) => {
      const duration = performance.now() - (store.startTime || 0);
      const { method } = request;
      const url = new URL(request.url);
      const path = url.pathname;
      const query = url.search || undefined;
      const status = (typeof set.status === 'number' ? set.status : undefined) || 200;
      const time = new Date().toLocaleTimeString('fr-FR');
      const requestId =
        set.headers['x-request-id'] || request.headers.get('x-request-id') || crypto.randomUUID();

      if (config.isProduction) {
        console.log(
          formatProdLog(time, requestId, method, status, formatTiming(duration), path, query),
        );
      } else {
        console.log(formatDevLog(time, requestId, method, status, duration, path, query));
      }
    })
    .as('scoped');
}
