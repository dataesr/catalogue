import { Declic } from '@dataesr/declic-sdk';
import { config } from '~/config';
import { fullSync } from './flows/full-sync';
import { syncCatalogResources } from './flows/sync-catalog-resources';
import { syncOdsDatasets } from './flows/sync-ods-datasets';
import { syncZenodoPublications } from './flows/sync-zenodo-publications';

export const platformFlows = [fullSync, syncOdsDatasets, syncZenodoPublications, syncCatalogResources];

export function createDeclicWorker() {
  return new Declic({
    url: config.declic.url,
    key: config.declic.key,
    app: 'plateform',
    env: config.isProduction ? 'production' : 'development',
    concurrency: 5,
  }).register(platformFlows);
}
