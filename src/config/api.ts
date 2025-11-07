export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname || 'localhost';
    const inferredPort = (() => {
      const configuredPort = import.meta.env.VITE_API_PORT;
      if (configuredPort && `${configuredPort}`.trim()) {
        return `${configuredPort}`.trim();
      }
      if (window.location.port === '5173') {
        return '8080';
      }
      return window.location.port;
    })();

    const portSegment = inferredPort ? `:${inferredPort}` : '';
    return `${protocol}//${hostname}${portSegment}`;
  }

  return 'http://localhost:9997';
}

export function getRealtimeBaseUrl(): string {
  const envUrl = import.meta.env.VITE_REALTIME_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname || 'localhost';
    const port = (import.meta.env.VITE_REALTIME_PORT || '9998').toString();

    if (!port) {
      return `${protocol}//${hostname}`;
    }

    return `${protocol}//${hostname}:${port}`;
  }

  return 'http://localhost:9998';
}

