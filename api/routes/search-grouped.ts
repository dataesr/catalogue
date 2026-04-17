import type { estypes } from '@elastic/elasticsearch';
import { Elysia } from 'elysia';
import { ES_ALIAS, elastic, extractHits, extractTotal } from '~/database/elastic';
import {
  type CatalogItem,
  groupedSearchParamsSchema,
  groupedSearchResponseSchema,
} from '~/schemas/catalog';
import { buildTextQuery } from '~/utils/catalog-query';

const SORT: estypes.SortCombinations[] = [
  { _score: { order: 'desc' } },
  { popularityScore: { order: 'desc' } },
];

function emptyResult() {
  return { results: [] as CatalogItem[], totalCount: 0 };
}

function extractResult(response: estypes.MsearchResponseItem<CatalogItem> | undefined) {
  if (!response || 'error' in response) return emptyResult();
  const r = response as estypes.SearchResponse<CatalogItem>;
  return { results: extractHits(r), totalCount: extractTotal(r) };
}

export const searchGroupedRoutes = new Elysia({ prefix: '/search' })
  .get(
    '/grouped',
    async ({ query }) => {
      const { q, limit = 5 } = query;
      const hasTextQuery = !!q?.trim();

      const must: estypes.QueryDslQueryContainer = hasTextQuery
        ? buildTextQuery(q as string)
        : { match_all: {} };

      const makeBody = (type: string) => ({
        query: { bool: { must: [must], filter: [{ term: { type } }] } },
        sort: SORT,
        size: limit,
        track_total_hits: true,
      });

      const { responses } = await elastic.msearch<CatalogItem>({
        searches: [
          { index: ES_ALIAS }, makeBody('resource'),
          { index: ES_ALIAS }, makeBody('dataset'),
          { index: ES_ALIAS }, makeBody('publication'),
        ],
      });

      const [resourcesRes, datasetsRes, publicationsRes] = responses;

      return {
        resources: extractResult(resourcesRes),
        datasets: extractResult(datasetsRes),
        publications: extractResult(publicationsRes),
      };
    },
    {
      query: groupedSearchParamsSchema,
      response: { 200: groupedSearchResponseSchema },
      detail: {
        description: 'Recherche groupée par type : ressources, jeux de données, publications',
        summary: 'Recherche groupée',
        tags: ['Catalogue'],
      },
    },
  );
