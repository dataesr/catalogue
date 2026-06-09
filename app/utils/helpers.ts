export const isStaging = process.env.BUN_PUBLIC_ENV === "staging"
export const isDevelopment = process.env.BUN_PUBLIC_ENV === "dev"
export const isProduction = process.env.BUN_PUBLIC_ENV === "production"
