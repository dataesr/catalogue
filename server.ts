import { serve } from 'bun';
import client from '@/index.html';
import { config, validateConfig } from '~/config';
import { createDeclicWorker } from '~/declic';
import { app } from '~/index';

import type { Declic } from '@dataesr/declic-sdk';

let worker: Declic | null = null;

async function bootstrap() {
  try {
    validateConfig();

    if (process.env.DECLIC_WORKER_ENABLED !== 'false' && config.declic.key) {
      worker = createDeclicWorker().connect();
    }

    const server = serve({
      routes: {
        '/api/*': app.handle,
        '/*': client,
      },
      development: config.isDevelopment,
      port: config.port,
      idleTimeout: 60,
      maxRequestBodySize: 1024 * 1024,
    });

    console.log(`
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    🚀 #dataESR Platform

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    📊 Environment: ${config.nodeEnv}

    🌐 Web Client: ${server.url}

    📚 API Docs: ${server.url}api/openapi

    👷 Task worker: ${worker ? 'connected' : 'disabled'}

    ✅ Ready to accept requests!

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    if (worker) await worker.disconnect();
    console.log('👋 Shutdown complete');
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  process.exit(0);
}

process.removeAllListeners('SIGINT');
process.removeAllListeners('SIGTERM');
process.removeAllListeners('SIGHUP');
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);

bootstrap();
