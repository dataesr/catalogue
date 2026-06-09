// export const isStaging = process.env.BUN_PUBLIC_ENV === "staging"
// export const isDevelopment = process.env.BUN_PUBLIC_ENV === "dev"
// export const isProduction = process.env.BUN_PUBLIC_ENV === "production"

// TODO: process is not defined while in production
export const isDevelopment = window.location.host === "localhost"
export const isStaging = window.location.host.includes(".staging")
export const isProduction = window.location.protocol.includes("https:") && !isDevelopment && !isStaging
