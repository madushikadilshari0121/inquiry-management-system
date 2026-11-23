export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = data?.error;

    // No JSON error body + 5xx → the API itself is down or unreachable (e.g. proxy can't connect)
    if (!err && res.status >= 500) {
      throw new ApiError(
        res.status,
        'SERVER_UNAVAILABLE',
        'The server is not responding right now. Please try again in a moment.'
      );
    }

    // Session expired while using the app → send the user back to login
    if (res.status === 401 && onUnauthorized && !path.startsWith('/auth/')) {
      onUnauthorized();
    }

    throw new ApiError(
      res.status,
      err?.code || 'UNKNOWN_ERROR',
      err?.message || 'Something went wrong. Please try again.',
      err?.details
    );
  }

  return data;
}