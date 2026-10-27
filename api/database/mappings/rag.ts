import type { estypes } from '@elastic/elasticsearch';

export const RAG_EMBEDDING_DIMENSIONS = 1024;

export const RAG_MAPPING: { settings: estypes.IndicesIndexSettings; mappings: estypes.MappingTypeMapping } = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        french_text: {
          type: "custom" as const,
          tokenizer: "standard",
          filter: ["lowercase", "french_elision", "french_stop", "french_stemmer", "asciifolding"],
        },
      },
      filter: {
        french_stop: { type: "stop", stopwords: "_french_" },
        french_elision: {
          type: "elision" as const,
          articles_case: true,
          articles: ["l", "m", "t", "qu", "n", "s", "j", "d", "c", "jusqu", "quoiqu", "lorsqu", "puisqu"],
        },
        french_stemmer: { type: "stemmer" as const, language: "light_french" },
      },
    },
  },
  mappings: {
    _source: { excludes: ["embedding"] },
    properties: {
      id: { type: "keyword" },
      catalog_item_id: { type: "keyword" },
      hkey: { type: "keyword" },
      document: { type: "text", analyzer: "french_text" },
      embedding: {
        type: "dense_vector",
        dims: RAG_EMBEDDING_DIMENSIONS,
        index: true,
        similarity: "cosine",
      },
      metadata: {
        properties: {
          title: { type: "text", analyzer: "french_text", fields: { keyword: { type: "keyword" } } },
          reference: { type: "keyword" },
          record_id: { type: "keyword" },
          publication_type: { type: "keyword" },
          publication_date: { type: "keyword" },
          publication_epoch: { type: "long" },
          file_key: { type: "keyword" },
          file_name: { type: "keyword" },
          file_format: { type: "keyword" },
          file_url: { type: "keyword", index: false },
          file_access: { type: "keyword" },
          file_checksum: { type: "keyword" },
          page_index: { type: "integer" },
          section_index: { type: "integer" },
          section_title: { type: "text", analyzer: "french_text", fields: { keyword: { type: "keyword" } } },
          section_level: { type: "integer" },
          chunk_len: { type: "integer" },
          chunk_type: { type: "keyword" },
          keywords: { type: "text", analyzer: "french_text", fields: { keyword: { type: "keyword" } } },
          topics: { type: "keyword" },
          author_names: { type: "keyword" },
        },
      },
    },
  },
}
