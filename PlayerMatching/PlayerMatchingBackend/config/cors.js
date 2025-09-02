// CORS configuration for different environments
const getAllowedOrigins = () => {
  const baseOrigins = [
    "http://localhost:3000",
    "http://localhost:5000", // Your current frontend
    "http://localhost:5173",
    "https://localhost:5000", // HTTPS version for local development
  ]

  const deploymentOrigins = [
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.NETLIFY_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean)

  // In production, you might want to be more restrictive
  if (process.env.NODE_ENV === "production") {
    return [...baseOrigins, ...deploymentOrigins]
  }

  // In development, allow all localhost origins
  return [
    ...baseOrigins,
    ...deploymentOrigins,
    /^http:\/\/localhost:\d+$/, // Allow any localhost port
  ]
}

export { getAllowedOrigins }
