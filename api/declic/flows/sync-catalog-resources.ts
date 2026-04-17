import crypto from 'node:crypto';
import { flow } from '@dataesr/declic-sdk';
import { t } from 'elysia';
import { ES_ALIAS, elastic } from '~/database/elastic';
import catalogData from '../../../catalog.json';

interface SeedResource {
  id: string;
  title: string;
  description: string;
  format: string;
  topics: string[];
  url: string | null;
  internalPath: string | null;
  requiresAuth: boolean;
  keywords: string[];
}

export const syncCatalogResources = flow({
  id: 'sync-catalog-resources',
  description: 'Index static catalog resources into Elasticsearch',
  input: t.Object({
    targetIndex: t.Optional(t.String()),
  }),
  options: { maxAttempts: 3, maxConcurrency: 1 },
  run: async ({ input, step }) => {
    const syncId = crypto.randomUUID();
    const index = input.targetIndex ?? ES_ALIAS;

    const resources = catalogData.resources as SeedResource[];

    const result = await step.run('index-resources', async ({ logger }) => {
      const bulkBody: unknown[] = [];

      for (const r of resources) {
        const doc = {
          id: `catalog-${r.id}`,
          type: 'resource',
          source: 'catalog',
          sourceId: r.id,
          title: r.title,
          description: r.description,
          topics: r.topics,
          keywords: r.keywords,
          url: r.url,
          thumbnailUrl: null,
          language: 'fr',
          license: null,
          licenseUrl: null,
          created: null,
          modified: null,
          published: null,
          authors: [],
          publisher: null,
          creator: null,
          downloads: 0,
          views: 0,
          apiCallCount: 0,
          popularityScore: 0,
          files: [],
          fileTypes: [],
          exports: [],
          odsThemes: [],
          recordsCount: 0,
          features: [],
          accrualPeriodicity: null,
          granularity: null,
          temporalCoverage: null,
          territory: [],
          recordsSize: 0,
          fields: [],
          fieldTypes: [],
          doi: null,
          doiUrl: null,
          conceptDoi: null,
          publicationType: null,
          journal: null,
          issue: null,
          issn: null,
          accessRight: null,
          format: r.format,
          internalPath: r.internalPath,
          requiresAuth: r.requiresAuth,
          relatedIds: [],
          syncId,
          indexedAt: new Date().toISOString(),
        };

        bulkBody.push({ index: { _index: index, _id: doc.id } });
        bulkBody.push(doc);
      }

      const bulkRes = await elastic.bulk({ body: bulkBody, refresh: true });
      const failedCount = bulkRes.items.filter((i) => i.index?.error).length;

      logger.info(
        `Catalog resources: ${resources.length - failedCount} indexed, ${failedCount} errors`,
      );
      return {
        indexed: resources.length - failedCount,
        errors: failedCount,
        total: resources.length,
      };
    });

    const cleanup = input.targetIndex
      ? { deleted: 0 }
      : await step.run('cleanup-stale', async ({ logger }) => {
          const res = await elastic.deleteByQuery({
            index: ES_ALIAS,
            body: {
              query: {
                bool: {
                  must: { term: { source: 'catalog' } },
                  must_not: { term: { syncId } },
                },
              },
            },
            refresh: true,
          });
          const deleted = res.deleted ?? 0;
          logger.info(`Catalog cleanup: ${deleted} stale document(s) removed`);
          return { deleted };
        });

    return { ...result, deleted: cleanup.deleted };
  },
});
