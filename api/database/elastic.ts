import { Client, type ClientOptions, type estypes, HttpConnection } from '@elastic/elasticsearch';
import { config } from '~/config';

const esConfig: ClientOptions = {
  Connection: HttpConnection,
  node: config.elastic.node,
  ...(config.elastic.username &&
    config.elastic.password && {
      auth: {
        username: config.elastic.username,
        password: config.elastic.password,
      },
    }),
  ...(config.elastic.apiKey && { auth: { apiKey: config.elastic.apiKey } }),
};

export const elastic = new Client(esConfig);

export const ES_ALIAS = config.elastic.indexes.catalog;

// ---------------------------------------------------------------------------
// Index / alias management helpers
// ---------------------------------------------------------------------------

export function createIndexName(): string {
  // Fix by annelhote - The ES index name should be suffix by YYYYMMDD instead of timestamp
  const today = new Date()
  return `${ES_ALIAS}-${today.toISOString().substring(0, 10).replace(/-/g, '')}`
}

export async function swapAlias(alias: string, newIndex: string): Promise<string[]> {
  const oldIndices: string[] = [];

  try {
    const aliasInfo = await elastic.indices.getAlias({ name: alias });
    oldIndices.push(...Object.keys(aliasInfo));
  } catch {
    // Alias doesn't exist yet — nothing to remove
  }

  await elastic.indices.updateAliases({
    actions: [{ remove: { index: '*', alias } }, { add: { index: newIndex, alias } }],
  });

  return oldIndices.filter((idx) => idx !== newIndex);
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

export function extractTotal(response: estypes.SearchResponse | undefined): number {
  if (!response) return 0;
  return typeof response.hits.total === 'number'
    ? response.hits.total
    : response.hits.total?.value || 0;
}

export function extractHits<T>(response: estypes.SearchResponse<T> | undefined): T[] {
  if (!response) return [];
  return response.hits.hits
    .map((hit) => hit._source)
    .filter((source): source is T => source !== undefined);
}

export type AggregationBucket = {
  key: string;
  count: number;
};

export function extractBuckets(
  agg: estypes.AggregationsAggregate | undefined,
): AggregationBucket[] {
  if (!agg) return [];

  const termsAgg = agg as estypes.AggregationsStringTermsAggregate;
  if (!termsAgg.buckets) return [];

  return (termsAgg.buckets as estypes.AggregationsStringTermsBucket[]).map((bucket) => ({
    key: String(bucket.key),
    count: bucket.doc_count,
  }));
}
