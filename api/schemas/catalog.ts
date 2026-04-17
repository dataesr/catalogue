import { t } from 'elysia';

// ─── Nested schemas ──────────────────────────────────────────

const authorSchema = t.Object({
  name: t.String(),
  affiliation: t.Nullable(t.String()),
  orcid: t.Nullable(t.String()),
});

const fileSchema = t.Object({
  key: t.String(),
  size: t.Number(),
  url: t.String(),
  type: t.Nullable(t.String()),
  checksum: t.Nullable(t.String()),
});

const exportSchema = t.Object({
  format: t.String(),
  url: t.String(),
});

const datasetFieldSchema = t.Object({
  name: t.String(),
  label: t.String(),
  type: t.String(),
  description: t.Nullable(t.String()),
});

const temporalCoverageSchema = t.Object({
  from: t.Nullable(t.String()),
  to: t.Nullable(t.String()),
});

// ─── Catalog item (unified document) ─────────────────────────

export const catalogItemSchema = t.Object({
  // Core
  id: t.String(),
  type: t.Union([t.Literal('dataset'), t.Literal('publication'), t.Literal('resource')]),
  source: t.Union([t.Literal('ods'), t.Literal('zenodo'), t.Literal('catalog')]),
  sourceId: t.String(),
  title: t.String(),
  description: t.String(),
  topics: t.Array(t.String()),
  keywords: t.Array(t.String()),
  url: t.Nullable(t.String()),
  thumbnailUrl: t.Nullable(t.String()),
  language: t.Nullable(t.String()),
  license: t.Nullable(t.String()),
  licenseUrl: t.Nullable(t.String()),

  // Dates
  created: t.Nullable(t.String()),
  modified: t.Nullable(t.String()),
  published: t.Nullable(t.String()),

  // People
  authors: t.Array(authorSchema),
  publisher: t.Nullable(t.String()),
  creator: t.Nullable(t.String()),

  // Stats
  downloads: t.Number(),
  views: t.Number(),
  apiCallCount: t.Number(),
  popularityScore: t.Number(),

  // Files & exports
  files: t.Array(fileSchema),
  fileTypes: t.Array(t.String()),
  exports: t.Array(exportSchema),

  // Dataset-specific
  odsThemes: t.Array(t.String()),
  recordsCount: t.Number(),
  features: t.Array(t.String()),
  accrualPeriodicity: t.Nullable(t.String()),
  granularity: t.Nullable(t.String()),
  temporalCoverage: t.Nullable(temporalCoverageSchema),
  territory: t.Array(t.String()),
  recordsSize: t.Number(),
  fields: t.Array(datasetFieldSchema),
  fieldTypes: t.Array(t.String()),

  // Publication-specific
  doi: t.Nullable(t.String()),
  doiUrl: t.Nullable(t.String()),
  conceptDoi: t.Nullable(t.String()),
  publicationType: t.Nullable(t.String()),
  journal: t.Nullable(t.String()),
  issue: t.Nullable(t.String()),
  issn: t.Nullable(t.String()),
  accessRight: t.Nullable(t.String()),

  // Resource-specific
  format: t.Nullable(t.String()),
  internalPath: t.Nullable(t.String()),
  requiresAuth: t.Boolean(),

  // Cross-references
  relatedIds: t.Array(t.String()),

  // ETL metadata
  syncId: t.Optional(t.String()),
  indexedAt: t.Optional(t.String()),
});

export type CatalogItem = typeof catalogItemSchema.static;

// ─── Facets ──────────────────────────────────────────────────

const facetBucketSchema = t.Object({
  key: t.String(),
  count: t.Number(),
});

export const catalogFacetsSchema = t.Object({
  type: t.Array(facetBucketSchema),
  topics: t.Array(facetBucketSchema),
  format: t.Array(facetBucketSchema),
  publicationType: t.Array(facetBucketSchema),
  publisher: t.Array(facetBucketSchema),
  features: t.Array(facetBucketSchema),
  fileTypes: t.Array(facetBucketSchema),
  accessRight: t.Array(facetBucketSchema),
});

export type CatalogFacets = typeof catalogFacetsSchema.static;

// ─── Search params ───────────────────────────────────────────

export const catalogSearchParamsSchema = t.Object({
  q: t.Optional(t.String()),
  type: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  topic: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  format: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  publicationType: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  publisher: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  features: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  fileType: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  accessRight: t.Optional(t.Union([t.String(), t.Array(t.String())])),
  sort: t.Optional(t.String()),
  page: t.Optional(t.Number({ default: 1 })),
  limit: t.Optional(t.Number({ default: 20 })),
});

export type CatalogSearchParams = typeof catalogSearchParamsSchema.static;

// ─── Search response ─────────────────────────────────────────

export const catalogSearchResponseSchema = t.Object({
  totalCount: t.Number(),
  results: t.Array(catalogItemSchema),
  facets: catalogFacetsSchema,
});

export type CatalogSearchResponse = typeof catalogSearchResponseSchema.static;

// ─── Grouped search ──────────────────────────────────────────

const typeResultsSchema = t.Object({
  results: t.Array(catalogItemSchema),
  totalCount: t.Number(),
});

export const groupedSearchParamsSchema = t.Object({
  q: t.Optional(t.String()),
  limit: t.Optional(t.Number({ default: 5 })),
});

export type GroupedSearchParams = typeof groupedSearchParamsSchema.static;

export const groupedSearchResponseSchema = t.Object({
  resources: typeResultsSchema,
  datasets: typeResultsSchema,
  publications: typeResultsSchema,
});

export type GroupedSearchResponse = typeof groupedSearchResponseSchema.static;
