import { flow } from '@dataesr/declic-sdk';
import { t } from 'elysia';
import { ES_ALIAS, elastic } from '~/database/elastic';
import { resolveZenodoTopics } from '../mappings/resolve-topics';
import { stripHtml } from '../utils';
import { config } from '~/config';


const ZENODO_COMMUNITY_ID = config.zenodoCommunityId;
const ZENODO_BASE = `https://zenodo.org/api/communities/${ZENODO_COMMUNITY_ID}/records`;
const PAGE_SIZE = 20;
const RATE_LIMIT_DELAY = 1000;

// ---------------------------------------------------------------------------
// Zenodo raw response types (internal to this flow)
// ---------------------------------------------------------------------------

interface ZenodoCreator {
  name: string;
  affiliation?: string;
  orcid?: string;
}

interface ZenodoFile {
  id: string;
  key: string;
  size: number;
  checksum?: string;
  links: { self?: string };
}

interface ZenodoHit {
  id: number;
  doi?: string;
  doi_url?: string;
  conceptdoi?: string;
  created?: string;
  modified?: string;
  metadata: {
    title: string;
    description?: string;
    publication_date?: string;
    access_right?: string;
    creators?: ZenodoCreator[];
    resource_type?: {
      title?: string;
      type?: string;
      subtype?: string;
    };
    journal?: {
      title?: string;
      issue?: string;
      volume?: string;
      pages?: string;
    };
    imprint?: {
      place?: string;
      publisher?: string;
    };
    keywords?: string[];
    alternate_identifiers?: Array<{
      identifier: string;
      scheme?: string;
    }>;
    license?: { id?: string };
    communities?: Array<{ id: string }>;
    relations?: {
      version?: Array<{
        index: number;
        is_last: boolean;
        parent: { pid_value: string };
      }>;
    };
  };
  links?: {
    self_html?: string;
    thumbnails?: Record<string, string>;
  };
  files?: ZenodoFile[];
  stats?: {
    downloads?: number;
    unique_downloads?: number;
    views?: number;
    unique_views?: number;
    version_downloads?: number;
    version_unique_downloads?: number;
    version_views?: number;
    version_unique_views?: number;
  };
}

interface ZenodoCommunityResponse {
  hits: {
    hits: ZenodoHit[];
    total: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFileType(key: string): string | null {
  const ext = key.split('.').pop()?.toLowerCase();
  return ext && ext.length <= 5 ? ext : null;
}

function extractIssn(altIds?: Array<{ identifier: string; scheme?: string }>): string | null {
  if (!altIds) return null;
  for (const alt of altIds) {
    if (alt.scheme === 'issn' || /^\d{4}-\d{3}[\dXx]$/.test(alt.identifier)) {
      return alt.identifier;
    }
  }
  return null;
}

async function fetchPage(
  url: string,
  logger: { warn: (msg: string) => void },
): Promise<ZenodoCommunityResponse> {
  const res = await fetch(url);
  if (res.status === 429) {
    logger.warn('Zenodo rate limit hit, waiting 60s...');
    await Bun.sleep(60_000);
    const retry = await fetch(url);
    if (!retry.ok) throw new Error(`Zenodo retry failed: ${retry.status}`);
    return retry.json();
  }
  if (!res.ok) throw new Error(`Zenodo fetch failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Normalizer — maps a Zenodo hit to the unified CatalogItem shape
// ---------------------------------------------------------------------------

function normalizeZenodoPublication(hit: ZenodoHit) {
  const m = hit.metadata;
  const journal = m.journal?.title ?? null;
  const { topics, keywords } = resolveZenodoTopics(m.keywords ?? []);

  const files = (hit.files ?? []).map((f) => ({
    key: f.key,
    size: f.size,
    url: f.links?.self ?? '',
    type: getFileType(f.key),
    checksum: f.checksum ?? null,
  }));

  const fileTypes = [...new Set(files.map((f) => f.type).filter((t): t is string => t !== null))];

  const authors = (m.creators ?? []).map((c) => ({
    name: c.name,
    affiliation: c.affiliation ?? null,
    orcid: c.orcid ?? null,
  }));

  return {
    id: `zenodo-${hit.id}`,
    type: 'publication' as const,
    source: 'zenodo' as const,
    sourceId: String(hit.id),
    title: m.title,
    description: m.description ? stripHtml(m.description) : '',
    topics,
    keywords,
    url: hit.links?.self_html ?? null,
    thumbnailUrl: hit.links?.thumbnails?.['250'] ?? null,
    language: 'fr',
    license: m.license?.id ?? null,
    licenseUrl: null,

    created: hit.created ?? null,
    modified: hit.modified ?? null,
    published: m.publication_date ?? null,

    authors,
    publisher: m.imprint?.publisher ?? null,
    creator: null,

    downloads: hit.stats?.unique_downloads ?? 0,
    views: hit.stats?.unique_views ?? 0,
    apiCallCount: 0,
    popularityScore: 0,

    files,
    fileTypes,
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

    doi: hit.doi ?? null,
    doiUrl: hit.doi_url ?? null,
    conceptDoi: hit.conceptdoi ?? null,
    publicationType: m.resource_type?.subtype ?? 'article',
    journal,
    issue: m.journal?.issue ?? null,
    issn: extractIssn(m.alternate_identifiers),
    accessRight: m.access_right ?? 'open',

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

export const syncZenodoPublications = flow({
  id: 'sync-zenodo-publications',
  description: 'Fetch all publications from Zenodo MESRE community and index into Elasticsearch',
  options: { maxAttempts: 3, maxConcurrency: 1, timeoutMs: 15 * 60 * 1000 },
  input: t.Object({
    targetIndex: t.Optional(t.String()),
  }),
  run: async ({ input, step, logger }) => {
    const syncId = crypto.randomUUID();
    const index = input.targetIndex ?? ES_ALIAS;

    const { totalCount } = await step.run('count', async ({ logger }) => {
      const res = await fetch(`${ZENODO_BASE}?size=1`);
      if (!res.ok) throw new Error(`Zenodo count request failed: ${res.status}`);
      const json: ZenodoCommunityResponse = await res.json();
      logger.info(`Zenodo community has ${json.hits.total} records`);
      return { totalCount: json.hits.total };
    });

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const result = await step.run('index-all', async ({ logger, progress }) => {
      let indexed = 0;
      let errors = 0;

      for (let page = 1; page <= totalPages; page++) {
        const url = `${ZENODO_BASE}?page=${page}&size=${PAGE_SIZE}&sort=newest`;
        const json = await fetchPage(url, logger);

        const bulkBody: unknown[] = [];

        for (const hit of json.hits.hits) {
          try {
            const doc = normalizeZenodoPublication(hit);
            bulkBody.push({ index: { _index: index, _id: doc.id } });
            bulkBody.push({ ...doc, syncId });
          } catch (err) {
            logger.warn(`Failed to normalize Zenodo record ${hit.id}: ${err}`);
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

        progress(page, totalPages, `${indexed} publications indexed`);
        logger.info(`Page ${page}/${totalPages} — ${indexed} indexed, ${errors} errors`);

        if (page < totalPages) await Bun.sleep(RATE_LIMIT_DELAY);
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
                must: { term: { source: 'zenodo' } },
                must_not: { term: { syncId } },
              },
            },
          });
          const count = res.deleted ?? 0;
          if (count > 0) logger.info(`Deleted ${count} stale Zenodo documents`);
          else logger.info('No stale Zenodo documents to remove');
          return { deleted: count };
        });

    logger.info(
      `Zenodo sync complete: ${result.indexed} indexed, ${result.errors} errors, ${deleted} stale deleted out of ${result.total}`,
    );
    return { indexed: result.indexed, errors: result.errors, total: result.total, deleted };
  },
});
