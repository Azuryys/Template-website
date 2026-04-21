// Centralized API configuration
// Uses NEXT_PUBLIC_API_URL environment variable with a sensible fallback for local development

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default API_URL;
