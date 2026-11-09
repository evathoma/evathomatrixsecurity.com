/**
 * Reusable API Client for Evatho Matrix Security Tanzania
 * Base URL: /api/v1
 */

const API_BASE_URL = '/api/v1';
const API_REQUEST_TIMEOUT_MS = 15000;

/**
 * Standard fetch wrapper for JSON REST endpoints
 * @param {string} endpoint - Path relative to /api/v1 (e.g. '/health')
 * @param {RequestInit} [options] - Fetch configuration options
 * @returns {Promise<{ ok: boolean, status: number, data?: any, error?: string }>}
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), API_REQUEST_TIMEOUT_MS);
  
  const defaultHeaders = {
    'Accept': 'application/json',
    ...(options.body && typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || timeoutController.signal,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : (data?.message || `Request failed with status ${response.status}`),
    };
  } catch (err) {
    const timedOut = timeoutController.signal.aborted;
    console.error(`[API ${timedOut ? 'Timeout' : 'Network Error'}] ${url}:`, err.message);
    return {
      ok: false,
      status: 0,
      data: null,
      error: timedOut
        ? 'The request timed out. We could not confirm whether your inquiry was saved. Please try again shortly.'
        : 'Network error or backend server is not reachable.',
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  checkHealth: () => apiRequest('/health'),
  checkDbHealth: () => apiRequest('/health/db'),
  sendInquiry: (data) =>
    apiRequest('/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Export to window for vanilla JS client access
window.api = api;
