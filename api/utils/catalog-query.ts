import type { estypes } from '@elastic/elasticsearch';

const MATCH_FIELDS = ['title^4', 'keywords^3', 'authorNames^2', 'description^1']

export function buildTextQuery(query: string): estypes.QueryDslQueryContainer {
  return {
    bool: {
      should: [
        { match_phrase: { title: { query, boost: 10 } } },
        { match_phrase: { 'title.raw': { query, boost: 8 } } },
        { match: { title: { query, operator: 'and', boost: 5 } } },
        {
          multi_match: {
            query,
            fields: MATCH_FIELDS,
            type: 'cross_fields',
            operator: 'and',
            boost: 3,
          },
        },
        {
          multi_match: {
            query,
            fields: MATCH_FIELDS,
            type: 'best_fields',
            fuzziness: 'AUTO',
            prefix_length: 2,
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
}
