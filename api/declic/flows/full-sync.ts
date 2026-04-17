import { flow } from '@dataesr/declic-sdk';
import { createIndexName, ES_ALIAS, elastic, swapAlias } from '~/database/elastic';
import { CATALOG_MAPPING } from '~/database/mappings/catalog';
import { syncCatalogResources } from './sync-catalog-resources';
import { syncOdsDatasets } from './sync-ods-datasets';
import { syncZenodoPublications } from './sync-zenodo-publications';

export const fullSync = flow({
  id: 'full-sync',
  description: 'Full catalog sync: create fresh index → populate in parallel → atomic alias swap',
  options: { maxAttempts: 1, maxConcurrency: 1, timeoutMs: 30 * 60 * 1000 },
  run: async ({ step }) => {
    const { index } = await step.run('create-index', async ({ logger }) => {
      const newIndex = createIndexName();
      logger.info(`Creating fresh index "${newIndex}"`);
      await elastic.indices.create({
        index: newIndex,
        settings: CATALOG_MAPPING.settings,
      });
      logger.info(`Index "${newIndex}" created, applying mapping...`);
      await elastic.indices.putMapping({
        index: newIndex,
        ...CATALOG_MAPPING.mappings,
      });
      logger.info(`Mapping applied to "${newIndex}"`);
      return { index: newIndex };
    });

    const [odsResults, zenodoResults, catalogResults] = await step.parallel('sync-sources', [
      { flow: syncOdsDatasets, items: [{ targetIndex: index }] },
      { flow: syncZenodoPublications, items: [{ targetIndex: index }] },
      { flow: syncCatalogResources, items: [{ targetIndex: index }] },
    ]);

    const odsResult = odsResults?.[0];
    const zenodoResult = zenodoResults?.[0];
    const catalogResult = catalogResults?.[0];

    const allCompleted =
      odsResult?.status === 'completed' &&
      zenodoResult?.status === 'completed' &&
      catalogResult?.status === 'completed';

    if (!allCompleted) {
      await step.run('cleanup-orphaned-index', async ({ logger }) => {
        logger.warn(`One or more sync sources failed — cleaning up orphaned index "${index}"`);
        await elastic.indices.delete({ index });
        logger.info(`Orphaned index "${index}" deleted`);
        return { cleaned: true };
      });

      const statuses = {
        ods: odsResult?.status ?? 'unknown',
        zenodo: zenodoResult?.status ?? 'unknown',
        catalog: catalogResult?.status ?? 'unknown',
      };
      throw new Error(`One or more sync sources failed: ${JSON.stringify(statuses)}`);
    }

    const stats = await step.run('swap-alias', async ({ logger }) => {
      await elastic.indices.refresh({ index });

      const count = await elastic.count({ index });
      logger.info(`New index "${index}" has ${count.count} documents`);

      if (count.count === 0) {
        throw new Error('New index is empty — refusing to swap alias');
      }

      const oldIndices = await swapAlias(ES_ALIAS, index);
      logger.info(`Alias "${ES_ALIAS}" now points to "${index}"`);

      for (const oldIndex of oldIndices) {
        logger.info(`Deleting old index "${oldIndex}"`);
        await elastic.indices.delete({ index: oldIndex });
      }

      return {
        totalDocuments: count.count,
        index,
        deletedIndices: oldIndices,
      };
    });

    return {
      totalDocuments: stats.totalDocuments,
      index: stats.index,
      ods: odsResult?.status ?? 'unknown',
      zenodo: zenodoResult?.status ?? 'unknown',
      catalog: catalogResult?.status ?? 'unknown',
    };
  },
});
