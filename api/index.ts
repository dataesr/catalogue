import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import { config } from '~/config';
import { createErrorHandler } from '~/http/error-handler';
import { createLogger } from '~/http/logger';
import { searchGroupedRoutes } from '~/routes/search-grouped';
import { searchRoutes } from '~/routes/search';

export const app = new Elysia({ prefix: '/api/plateform' })
  .use(cors({ credentials: true }))
  .use(createLogger({ isProduction: config.isProduction }))
  .use(
    openapi({
      documentation: {
        info: {
          title: '#dataESR Platform',
          version: '1.0.0',
          description: 'Platform API',
        },
      },
    }),
  )
  .use(createErrorHandler({ isProduction: config.isProduction }))
  .use(searchRoutes)
  .use(searchGroupedRoutes)
  .get('/health', () => ({ status: 'ok', app: 'plateform' }), {
    detail: {
      description: 'Health check',
      tags: ['System'],
    },
  });
