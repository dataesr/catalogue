import type { estypes } from '@elastic/elasticsearch';

export function buildTextQuery(q: string): estypes.QueryDslQueryContainer {
  return {
    bool: {
      should: [
        { match_phrase: { title: { query: q, boost: 10 } } },
        { match_phrase: { 'title.raw': { query: q, boost: 8 } } },
        { match: { title: { query: q, operator: 'and', boost: 5 } } },
        {
          multi_match: {
            query: q,
            fields: ['title^4', 'keywords^3', 'authors.name^2', 'description^1'],
            type: 'cross_fields',
            operator: 'and',
            boost: 3,
          },
        },
        {
          multi_match: {
            query: q,
            fields: ['title^3', 'keywords^2', 'description', 'authors.name^2'],
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
