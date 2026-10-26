const port = parseInt(process.env.PORT || '3000', 10);

const isDeployed = process.env.NODE_ENV === 'production'

const APP_ENVS = ["local", "development", "staging", "production"] as const;
type AppEnv = (typeof APP_ENVS)[number];
const env = (isDeployed ? process.env.ENV : 'local') as AppEnv

export const config = {
  env,
  isDeployed,
  isDevelopment: env === "development",
  isStaging: env === "staging",
  isProduction: env === "production",
  appName: "catalogue",
  zenodoCommunityId: process.env.ZENODO_COMMUNITY_ID || "",
  port,
  declic: {
    env: isDeployed ? env : "development",
    enable: process.env.DECLIC_WORKER_ENABLED !== "false",
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
    ocrCacheDir: process.env.RAG_OCR_CACHE_DIR || "/ocr",
  },
  ods: {
    apiKey: process.env.ODS_API_KEY || "",
  },
} as const

const REQUIRED_WHEN_DEPLOYED = [
  'ENV', 'ELASTIC_NODE', 'ELASTIC_USERNAME', 'ELASTIC_PASSWORD',
  'ZENODO_COMMUNITY_ID', 'DECLIC_URL', 'DECLIC_KEY', 'ODS_API_KEY',
  'AWS_ACCESS_KEY_ID', 'AWS_SECRET_KEY', 'AWS_REGION', 'AWS_ENDPOINT', 'AWS_BUCKET',
] as const;

export function validateConfig() {
  const errors = []

  if (!APP_ENVS.includes(env as AppEnv)) {
    errors.push(`ENV must be one of ${APP_ENVS.join(", ")} (got ${env ?? "nothing"})`);
  }
  if (isDeployed) {
    for (const name of REQUIRED_WHEN_DEPLOYED) {
      if (!process.env[name]) errors.push(`${name} is required`);
    }
    if (Boolean(config.mlHub.url) !== Boolean(config.mlHub.apiKey)) {
      errors.push('ML_HUB_API_URL and ML_HUB_API_KEY must be configured together');
    }
  }

  if (errors.length > 0) throw new Error(`Invalid configuration:\n- ${errors.join('\n- ')}`)
}
