const port = parseInt(process.env.PORT || '3000', 10);

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: (process.env.NODE_ENV || "development") === "development",
  isStaging: process.env.ENV === "staging",
  isProduction: process.env.NODE_ENV === "production",
  env: process.env.ENV || process.env.NODE_ENV || "development",
  appName: "catalogue",
  zenodoCommunityId: process.env.ZENODO_COMMUNITY_ID || "",
  port,
  declic: {
    url: process.env.DECLIC_URL || "ws://localhost:4100/api/connect",
    key: process.env.DECLIC_KEY || "",
  },
  elastic: {
    node: process.env.ELASTIC_NODE || "http://localhost:9200",
    username: process.env.ELASTIC_USERNAME || "",
    password: process.env.ELASTIC_PASSWORD || "",
    indexes: {
      catalog: process.env.ES_PLATEFORM_CATALOG_INDEX || "catalog",
      catalogRag: process.env.ES_PLATEFORM_CATALOG_RAG_INDEX || "catalog-rag",
    },
    apiKey: process.env.ES_API_KEY || "",
  },
  mlHub: {
    url: process.env.ML_HUB_API_URL || "",
    apiKey: process.env.ML_HUB_API_KEY || "",
  },
  mistral: {
    apiKey: process.env.MISTRAL_API_KEY || "",
  },
  rag: {
    ocrCacheDir: process.env.RAG_OCR_CACHE_DIR || "pvc/rag/ocr",
  },
  ods: {
    apiKey: process.env.ODS_API_KEY || "",
  },
} as const

export function validateConfig() {
  if (config.isProduction && !process.env.ELASTIC_NODE) {
    throw new Error('ELASTIC_NODE is required in production');
  }
  if (config.isProduction && !process.env.ELASTIC_USERNAME) {
    throw new Error('ELASTIC_USERNAME is required in production');
  }
  if (config.isProduction && !process.env.ELASTIC_PASSWORD) {
    throw new Error('ELASTIC_PASSWORD is required in production');
  }
  if (config.isProduction && !process.env.ZENODO_COMMUNITY_ID) {
    throw new Error('ZENODO_COMMUNITY_ID is required in production');
  }
  if (config.isProduction && !process.env.DECLIC_KEY) {
    throw new Error('DECLIC_KEY is required in production');
  }
  if (config.isProduction && !process.env.DECLIC_URL) {
    throw new Error('DECLIC_URL is required in production');
  }
  if (Boolean(config.mlHub.url) !== Boolean(config.mlHub.apiKey)) {
    throw new Error('ML_HUB_API_URL and ML_HUB_API_KEY must be configured together');
  }
  if (config.isProduction && !process.env.ODS_API_KEY) {
    throw new Error('ODS_API_KEY is required in production');
  }
  if (config.isProduction && !process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is required in production');
  }
}
