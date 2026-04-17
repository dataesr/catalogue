import type { estypes } from '@elastic/elasticsearch';

export const CATALOG_MAPPING: { settings: estypes.IndicesIndexSettings; mappings: estypes.MappingTypeMapping } = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        french_text: {
          type: 'custom' as const,
          tokenizer: 'standard',
          filter: ['lowercase', 'french_elision', 'french_stemmer', 'asciifolding'],
        },
      },
      filter: {
        french_elision: {
          type: 'elision' as const,
          articles_case: true,
          articles: ['l', 'm', 't', 'qu', 'n', 's', 'j', 'd', 'c', 'jusqu', 'quoiqu', 'lorsqu', 'puisqu'],
        },
        french_stemmer: { type: 'stemmer' as const, language: 'light_french' },
      },
    },
  },
  mappings: {
    properties: {
      // ─── CORE (all types) ──────────────────────────────────
      id:            { type: 'keyword' },
      type:          { type: 'keyword' },                // "dataset" | "publication" | "resource"
      source:        { type: 'keyword' },                // "ods" | "zenodo" | "catalog"
      sourceId:      { type: 'keyword' },                // Original ID in source system
      title:         { type: 'text', analyzer: 'french_text', fields: { keyword: { type: 'keyword' }, raw: { type: 'text' } } },
      description:   { type: 'text', analyzer: 'french_text' },
      topics:        { type: 'keyword' },                // Our 8 editorial topics
      keywords:      { type: 'keyword' },                // Free-text tags from source
      url:           { type: 'keyword', index: false },  // Canonical URL
      thumbnailUrl:  { type: 'keyword', index: false },
      language:      { type: 'keyword' },
      license:       { type: 'keyword' },
      licenseUrl:    { type: 'keyword', index: false },

      // ─── DATES ─────────────────────────────────────────────
      created:   { type: 'date' },
      modified:  { type: 'date' },
      published: { type: 'date' },

      // ─── PEOPLE ────────────────────────────────────────────
      authors: {
        type: 'nested',
        properties: {
          name:        { type: 'text', analyzer: 'french_text', fields: { keyword: { type: 'keyword' } } },
          affiliation: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          orcid:       { type: 'keyword' },
        },
      },
      publisher: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      creator:   { type: 'text', fields: { keyword: { type: 'keyword' } } },

      // ─── STATS / POPULARITY ────────────────────────────────
      downloads:       { type: 'integer' },
      views:           { type: 'integer' },
      apiCallCount:    { type: 'integer' },
      popularityScore: { type: 'float' },

      // ─── FILES / EXPORTS ───────────────────────────────────
      files: {
        type: 'nested',
        properties: {
          key:      { type: 'keyword' },
          size:     { type: 'long' },
          url:      { type: 'keyword', index: false },
          type:     { type: 'keyword' },
          checksum: { type: 'keyword', index: false },
        },
      },
      fileTypes: { type: 'keyword' },
      exports: {
        type: 'nested',
        properties: {
          format: { type: 'keyword' },
          url:    { type: 'keyword', index: false },
        },
      },

      // ─── DATASET-SPECIFIC ──────────────────────────────────
      odsThemes:          { type: 'keyword' },
      recordsCount:       { type: 'integer' },
      features:           { type: 'keyword' },
      accrualPeriodicity: { type: 'keyword' },
      granularity:        { type: 'keyword' },
      temporalCoverage: {
        properties: {
          from: { type: 'date', format: 'yyyy-MM-dd||strict_date_optional_time' },
          to:   { type: 'date', format: 'yyyy-MM-dd||strict_date_optional_time' },
        },
      },
      territory:   { type: 'keyword' },
      recordsSize: { type: 'long' },
      fields: {
        type: 'nested',
        properties: {
          name:        { type: 'keyword' },
          label:       { type: 'text' },
          type:        { type: 'keyword' },
          description: { type: 'text' },
        },
      },
      fieldTypes: { type: 'keyword' },

      // ─── PUBLICATION-SPECIFIC ──────────────────────────────
      doi:             { type: 'keyword' },
      doiUrl:          { type: 'keyword', index: false },
      conceptDoi:      { type: 'keyword' },
      publicationType: { type: 'keyword' },
      journal:         { type: 'text', fields: { keyword: { type: 'keyword' } } },
      issue:           { type: 'keyword' },
      issn:            { type: 'keyword' },
      accessRight:     { type: 'keyword' },

      // ─── RESOURCE-SPECIFIC ─────────────────────────────────
      format:       { type: 'keyword' },
      internalPath: { type: 'keyword' },
      requiresAuth: { type: 'boolean' },

      // ─── CROSS-REFERENCES ──────────────────────────────────
      relatedIds: { type: 'keyword' },

      // ─── INDEX METADATA ────────────────────────────────────
      indexedAt: { type: 'date' },
      syncId:    { type: 'keyword' },
    },
  },
};
