import { flow } from '@dataesr/declic-sdk';
import { t } from 'elysia';
import { config } from '~/config';
import { ES_ALIAS, elastic } from '~/database/elastic';
import { stripHtml } from '../utils';

const ODS_BASE = 'https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1';
const PAGE_SIZE = 100;
const ODS_WHERE = 'records_count>0';
const EXPORT_FORMATS = ['csv', 'json', 'xlsx', 'parquet'] as const;

// ---------------------------------------------------------------------------
// ODS raw response types (internal to this flow)
// ---------------------------------------------------------------------------

interface OdsMetas {
  default: {
    title?: string;
    description?: string;
    theme?: string[];
    keyword?: string[];
    records_count?: number;
    modified?: string;
    publisher?: string;
    license?: string;
    license_url?: string;
    language?: string;
    territory?: string[];
    data_processed?: string;
  };
  dcat?: {
    created?: string;
    creator?: string;
    accrualperiodicity?: string;
    granularity?: string;
    spatial?: string;
    temporal?: string;
    temporal_coverage_start?: string;
    temporal_coverage_end?: string;
  };
  explore?: {
    download_count?: number;
    api_call_count?: number;
    popularity_score?: number;
  };
  processing?: {
    records_size?: number;
  };
  custom?: {
    temporal_coverage_from?: string;
    temporal_coverage_to?: string;
  };
}

interface OdsField {
  name: string;
  label: string;
  type: string;
  description?: string | null;
}

interface OdsDataset {
  dataset_id: string;
  visibility?: string;
  features?: string[];
  has_records?: boolean;
  metas: OdsMetas;
  fields?: OdsField[];
}

interface OdsCatalogResponse {
  total_count: number;
  results: OdsDataset[];
}

// ---------------------------------------------------------------------------
// Normalizer — maps an ODS dataset to the unified CatalogItem shape
// ---------------------------------------------------------------------------

function normalizeOdsDataset(raw: OdsDataset) {
  const d = raw.metas.default;
  const dcat = raw.metas.dcat;
  const explore = raw.metas.explore;
  const processing = raw.metas.processing;
  const custom = raw.metas.custom;

  const themes = d.theme ?? [];
  const keywords = d.keyword ?? [];
  const topics = themes;

  const datasetId = raw.dataset_id;
  const odsPageUrl = `https://data.enseignementsup-recherche.gouv.fr/explore/assets/${datasetId}/`;

  const fields = (raw.fields ?? []).map((f) => ({
    name: f.name,
    label: f.label ?? f.name,
    type: f.type,
    description: f.description ?? null,
  }));

  const fieldTypes = [...new Set(fields.map((f) => f.type))];

  // Temporal coverage from multiple sources
  const temporalFrom = custom?.temporal_coverage_from ?? dcat?.temporal_coverage_start ?? null;
  const temporalTo = custom?.temporal_coverage_to ?? dcat?.temporal_coverage_end ?? null;
  const temporalCoverage =
    temporalFrom || temporalTo ? { from: temporalFrom, to: temporalTo } : null;

  return {
    id: `ods-${datasetId}`,
    type: 'dataset' as const,
    source: 'ods' as const,
    sourceId: datasetId,
    title: d.title ?? datasetId,
    description: d.description ? stripHtml(d.description) : '',
    topics,
    keywords,
    url: odsPageUrl,
    thumbnailUrl: null,
    language: d.language ?? 'fr',
    license: d.license ?? null,
    licenseUrl: d.license_url ?? null,

    created: dcat?.created ?? null,
    modified: d.modified ?? null,
    published: d.data_processed ?? null,

    authors: [],
    publisher: d.publisher ?? null,
    creator: dcat?.creator ?? null,

    downloads: explore?.download_count ?? 0,
    views: 0,
    apiCallCount: explore?.api_call_count ?? 0,
    popularityScore: explore?.popularity_score ?? 0,

    files: [],
    fileTypes: [],
    exports: EXPORT_FORMATS.map((fmt) => ({
      format: fmt,
      url: `${ODS_BASE}/catalog/datasets/${datasetId}/exports/${fmt}`,
    })),

    odsThemes: themes,
    recordsCount: d.records_count ?? 0,
    features: raw.features ?? [],
    accrualPeriodicity: dcat?.accrualperiodicity ?? null,
    granularity: dcat?.granularity ?? null,
    temporalCoverage,
    territory: d.territory ?? [],
    recordsSize: processing?.records_size ?? 0,
    fields,
    fieldTypes,

    doi: null,
    doiUrl: null,
    conceptDoi: null,
    publicationType: null,
    journal: null,
    issue: null,
    issn: null,
    accessRight: null,

    format: null,
    internalPath: null,
    requiresAuth: false,

    relatedIds: [],
    indexedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Flow definition
// ---------------------------------------------------------------------------

export const syncOdsDatasets = flow({
  id: 'sync-ods-datasets',
  description: 'Fetch all datasets from Opendatasoft and index into Elasticsearch',
  input: t.Object({
    targetIndex: t.Optional(t.String()),
  }),
  options: { maxAttempts: 3, maxConcurrency: 1, timeoutMs: 10 * 60 * 1000 },
  run: async ({ input, step, logger }) => {
    const apiKey = config.ods.apiKey;
    const headers: Record<string, string> = apiKey ? { Authorization: `Apikey ${apiKey}` } : {};
    const syncId = crypto.randomUUID();
    const index = input.targetIndex ?? ES_ALIAS;

    const { totalCount } = await step.run('count', async ({ logger }) => {
      const params = new URLSearchParams({ limit: '0', where: ODS_WHERE });
      const res = await fetch(`${ODS_BASE}/catalog/datasets?${params}`, { headers });
      if (!res.ok) {
        logger.error(
          JSON.stringify(
            { status: res.status, headers: res.headers, body: await res.text() },
            null,
            2,
          ),
        );
        throw new Error(`ODS count request failed: ${res.status}`);
      }
      const json: OdsCatalogResponse = await res.json();
      logger.info(`ODS reports ${json.total_count} datasets`);
      return { totalCount: json.total_count };
    });

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const result = await step.run('index-all', async ({ logger, progress }) => {
      let indexed = 0;
      let errors = 0;

      for (let page = 0; page < totalPages; page++) {
        const offset = page * PAGE_SIZE;
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
          where: ODS_WHERE,
          include_app_metas: 'true',
        });
        const res = await fetch(`${ODS_BASE}/catalog/datasets?${params}`, { headers });
        if (!res.ok) throw new Error(`ODS fetch failed on page ${page + 1}: ${res.status}`);
        const json: OdsCatalogResponse = await res.json();

        const bulkBody: unknown[] = [];

        for (const ds of json.results) {
          if (ds.visibility && ds.visibility !== 'domain') continue;
          try {
            const doc = normalizeOdsDataset(ds);
            bulkBody.push({ index: { _index: index, _id: doc.id } });
            bulkBody.push({ ...doc, syncId });
          } catch (err) {
            logger.warn(`Failed to normalize dataset ${ds.dataset_id}: ${err}`);
            errors++;
          }
        }

        if (bulkBody.length > 0) {
          const bulkRes = await elastic.bulk({ body: bulkBody, refresh: false });
          if (bulkRes.errors) {
            const failedItems = bulkRes.items.filter((i) => i.index?.error);
            errors += failedItems.length;
            indexed += bulkBody.length / 2 - failedItems.length;
            for (const item of failedItems) {
              logger.warn(`Bulk index error: ${JSON.stringify(item.index?.error)}`);
            }
          } else {
            indexed += bulkBody.length / 2;
          }
        }

        progress(page + 1, totalPages, `${indexed} datasets indexed`);
        logger.info(`Page ${page + 1}/${totalPages} — ${indexed} indexed, ${errors} errors`);
      }

      return { indexed, errors, total: totalCount };
    });

    const { deleted } = input.targetIndex
      ? { deleted: 0 }
      : await step.run('cleanup-stale', async ({ logger }) => {
          const res = await elastic.deleteByQuery({
            index: ES_ALIAS,
            query: {
              bool: {
                must: { term: { source: 'ods' } },
                must_not: { term: { syncId } },
              },
            },
          });
          const count = res.deleted ?? 0;
          if (count > 0) logger.info(`Deleted ${count} stale ODS documents`);
          else logger.info('No stale ODS documents to remove');
          return { deleted: count };
        });

    logger.info(
      `ODS sync complete: ${result.indexed} indexed, ${result.errors} errors, ${deleted} stale deleted out of ${result.total}`,
    );
    return { indexed: result.indexed, errors: result.errors, total: result.total, deleted };
  },
});
