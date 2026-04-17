import { NotFoundError } from '~/http/errors';
import type { estypes } from '@elastic/elasticsearch';
import { Elysia, t } from 'elysia';
import { ES_ALIAS, elastic, extractBuckets, extractHits, extractTotal } from '~/database/elastic';
import {
  type CatalogItem,
  catalogItemSchema,
  catalogSearchParamsSchema,
  catalogSearchResponseSchema,
} from '~/schemas/catalog';
import { buildTextQuery } from '~/utils/catalog-query';

const FACET_FIELD_MAP: Record<string, string> = {
  type: 'type',
  topic: 'topics',
  format: 'format',
  publicationType: 'publicationType',
  publisher: 'publisher.keyword',
  features: 'features',
  fileType: 'fileTypes',
  accessRight: 'accessRight',
};

const AGG_FIELDS: Record<string, string> = {
  type: 'type',
  topics: 'topics',
  format: 'format',
  publicationType: 'publicationType',
  publisher: 'publisher.keyword',
  features: 'features',
  fileTypes: 'fileTypes',
  accessRight: 'accessRight',
};

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}



function buildSort(sort: string, hasTextQuery: boolean): estypes.SortCombinations[] {
  switch (sort) {
    case 'relevance':
      return [{ _score: { order: 'desc' } }, { popularityScore: { order: 'desc' } }];
    case 'newest':
      return [
        { published: { order: 'desc', missing: '_last' } },
        { modified: { order: 'desc', missing: '_last' } },
      ];
    case 'oldest':
      return [
        { published: { order: 'asc', missing: '_last' } },
        { modified: { order: 'asc', missing: '_last' } },
      ];
    case 'popularity':
      return [{ popularityScore: 'desc' }];
    case 'downloads':
      return [{ downloads: 'desc' }];
    default:
      return [{ _score: { order: 'desc' } }];
  }
}

export const searchRoutes = new Elysia({ prefix: '/search' })
  .get(
    '/',
    async ({ query }) => {
      const {
        q,
        type,
        topic,
        format,
        publicationType,
        publisher,
        features,
        fileType,
        accessRight,
      } = query;

      const sort = query.sort ?? 'relevance';
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;

      const hasTextQuery = !!q?.trim();

      const must: estypes.QueryDslQueryContainer[] = hasTextQuery
        ? [buildTextQuery(q as string)]
        : [{ match_all: {} }];

      const should: estypes.QueryDslQueryContainer[] = [
        { constant_score: { filter: { term: { type: 'resource' } }, boost: 2 } },
      ];

      const filterParams = {
        type,
        topic,
        format,
        publicationType,
        publisher,
        features,
        fileType,
        accessRight,
      };
      const filter: estypes.QueryDslQueryContainer[] = [];

      for (const [param, esField] of Object.entries(FACET_FIELD_MAP)) {
        const values = toArray(filterParams[param as keyof typeof filterParams]);
        if (values.length > 0) {
          filter.push({ terms: { [esField]: values } });
        }
      }

      const aggs: Record<string, estypes.AggregationsAggregationContainer> = {};
      for (const [aggName, field] of Object.entries(AGG_FIELDS)) {
        aggs[aggName] = { terms: { field, size: 50 } };
      }

      const response = await elastic.search<CatalogItem>({
        index: ES_ALIAS,
        query: { bool: { must, filter, should } },
        sort: buildSort(sort, hasTextQuery),
        aggs,
        size: limit,
        from: (page - 1) * limit,
        track_total_hits: true,
      });

      const aggregations = response.aggregations ?? {};

      return {
        totalCount: extractTotal(response),
        results: extractHits(response),
        facets: {
          type: extractBuckets(aggregations.type),
          topics: extractBuckets(aggregations.topics),
          format: extractBuckets(aggregations.format),
          publicationType: extractBuckets(aggregations.publicationType),
          publisher: extractBuckets(aggregations.publisher),
          features: extractBuckets(aggregations.features),
          fileTypes: extractBuckets(aggregations.fileTypes),
          accessRight: extractBuckets(aggregations.accessRight),
        },
      };
    },
    {
      query: catalogSearchParamsSchema,
      response: { 200: catalogSearchResponseSchema },
      detail: {
        description:
          'Rechercher dans le catalogue unifié (jeux de données, publications, ressources)',
        tags: ['Catalogue'],
      },
    },
  )
  .get(
    '/:id',
    async ({ params }) => {
      try {
        const response = await elastic.get<CatalogItem>({ index: ES_ALIAS, id: params.id });

        if (!response._source) {
          throw new NotFoundError(`Document ${params.id} introuvable`);
        }

        return response._source;
      } catch (err: unknown) {
        if (err instanceof NotFoundError) throw err;

        const isNotFound =
          err instanceof Error &&
          'statusCode' in err &&
          (err as { statusCode: number }).statusCode === 404;

        if (isNotFound) {
          throw new NotFoundError(`Document ${params.id} introuvable`);
        }

        throw err;
      }
    },
    {
      params: t.Object({ id: t.String() }),
      response: { 200: catalogItemSchema },
      detail: {
        description: "Détail d'un élément du catalogue",
        tags: ['Catalogue'],
      },
    },
  );
