/**
 * Get the API base URL from environment or use default for development
 * Supports Next.js environment variables (NEXT_PUBLIC_API_BASE)
 */
export function getApiBaseUrl() {
  // Use Next.js public environment variable if available
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  
  // Default to backend on localhost:3001 for development
  // In production, set NEXT_PUBLIC_API_BASE environment variable
  return 'http://localhost:3001';
}

/**
 * Build full API endpoint URL
 * @param {string} path - API path (e.g., '/api/logos')
 * @returns {string} - Full URL
 */
export function buildApiUrl(path) {
  const baseUrl = getApiBaseUrl();
  return baseUrl + path;
}
